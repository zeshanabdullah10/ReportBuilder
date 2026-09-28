"""Python bindings for the Report Builder engine (ctypes, no dependencies).

    from reportbuilder import ReportBuilder
    rb = ReportBuilder()                      # finds the library next to this file or via $REPORTBUILDER_LIB
    result = rb.render("final-test.rbt.json", {"dut": {"serial": "SN1"}}, "out/SN1.pdf", pdfa=True)
    pdf_bytes = rb.render_bytes(template_dict, data_dict)
"""
from __future__ import annotations

import ctypes
import json
import os
import sys
from pathlib import Path
from typing import Any, Optional

__all__ = ["ReportBuilder", "ReportError"]

RB_OK, RB_ERR_USAGE, RB_ERR_VALIDATION, RB_ERR_RENDER, RB_ERR_BUFFER, RB_ERR_INTERNAL = 0, 1, 2, 3, -1, -2


class ReportError(RuntimeError):
    def __init__(self, code: int, result: dict):
        self.code = code
        self.result = result
        detail = result.get("error", "failed")
        issues = result.get("issues") or []
        super().__init__(f"[{code}] {detail}" + (": " + "; ".join(issues) if issues else ""))


def _default_library() -> str:
    env = os.environ.get("REPORTBUILDER_LIB")
    if env:
        return env
    name = {"win32": "reportbuilder.dll", "darwin": "libreportbuilder.dylib"}.get(sys.platform, "libreportbuilder.so")
    here = Path(__file__).resolve().parent
    for candidate in (here / name, here.parent.parent / "target" / "release" / name, here.parent.parent / "target" / "debug" / name):
        if candidate.exists():
            return str(candidate)
    return name  # let the OS loader search


class ReportBuilder:
    def __init__(self, library: Optional[str] = None, result_size: int = 64 * 1024):
        self._lib = ctypes.CDLL(library or _default_library())
        self._size = result_size
        c = ctypes.c_char_p
        i32 = ctypes.c_int32
        self._lib.rb_version.argtypes = [c, i32]
        self._lib.rb_render.argtypes = [c, c, c, c, c, i32]
        self._lib.rb_render_file.argtypes = [c, c, c, c, c, i32]
        self._lib.rb_validate.argtypes = [c, c, c, i32]
        self._lib.rb_render_to_memory.argtypes = [
            c, c, c, ctypes.POINTER(ctypes.POINTER(ctypes.c_uint8)), ctypes.POINTER(ctypes.c_size_t), c, i32,
        ]
        self._lib.rb_free.argtypes = [ctypes.POINTER(ctypes.c_uint8), ctypes.c_size_t]
        for f in ("rb_version", "rb_render", "rb_render_file", "rb_validate", "rb_render_to_memory"):
            getattr(self._lib, f).restype = i32
        self._lib.rb_free.restype = None

    @staticmethod
    def _enc(v: Any) -> Optional[bytes]:
        if v is None:
            return None
        if isinstance(v, (dict, list)):
            v = json.dumps(v, ensure_ascii=False)
        return str(v).encode("utf-8")

    def _call(self, fn, *args) -> dict:
        buf = ctypes.create_string_buffer(self._size)
        code = fn(*args, buf, self._size)
        result = json.loads(buf.value.decode("utf-8")) if buf.value else {}
        if code != RB_OK:
            raise ReportError(code, result)
        return result

    @property
    def version(self) -> str:
        buf = ctypes.create_string_buffer(64)
        self._lib.rb_version(buf, 64)
        return buf.value.decode()

    def render(self, template: str | os.PathLike, data: Any, output: str | os.PathLike, *,
               pdfa: bool = False, strict: bool = False, now: Optional[str] = None) -> dict:
        """Render `template` with `data` (dict/list/JSON string/None) to the PDF file `output`."""
        opts = {"pdfa": pdfa, "strict": strict, **({"now": now} if now else {})}
        return self._call(self._lib.rb_render, self._enc(os.fspath(template)), self._enc(data),
                          self._enc(os.fspath(output)), self._enc(opts))

    def validate(self, template: str | os.PathLike, data: Any = None) -> dict:
        buf = ctypes.create_string_buffer(self._size)
        code = self._lib.rb_validate(self._enc(os.fspath(template)), self._enc(data), buf, self._size)
        result = json.loads(buf.value.decode("utf-8"))
        if code not in (RB_OK, RB_ERR_VALIDATION):
            raise ReportError(code, result)
        return result

    def render_bytes(self, template: Any, data: Any = None, *, pdfa: bool = False) -> bytes:
        """Render a template (dict or JSON string) to PDF bytes in memory."""
        ptr = ctypes.POINTER(ctypes.c_uint8)()
        size = ctypes.c_size_t(0)
        buf = ctypes.create_string_buffer(self._size)
        code = self._lib.rb_render_to_memory(self._enc(template), self._enc(data), self._enc({"pdfa": pdfa}),
                                             ctypes.byref(ptr), ctypes.byref(size), buf, self._size)
        if code != RB_OK:
            raise ReportError(code, json.loads(buf.value.decode("utf-8") or "{}"))
        try:
            return ctypes.string_at(ptr, size.value)
        finally:
            self._lib.rb_free(ptr, size)
