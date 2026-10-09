/*
 * Report Builder — C API
 *
 * Link against reportbuilder.dll / libreportbuilder.so / libreportbuilder.dylib.
 * All functions are thread-safe and never throw. Strings are UTF-8 or
 * Windows-1252 (LabVIEW's default); results are UTF-8 JSON.
 *
 * Return codes
 *    0  RB_OK
 *    1  RB_ERR_USAGE        bad path, unreadable file, invalid JSON
 *    2  RB_ERR_VALIDATION   template errors (or warnings with "strict": true)
 *    3  RB_ERR_RENDER       layout or PDF generation failed
 *   -1  RB_ERR_BUFFER       result buffer too small (result truncated)
 *   -2  RB_ERR_INTERNAL     unexpected internal error
 *
 * Every failure result is {"ok":false,"stage":"...","error":"..."} where stage is one of
 * options, template, data, validate, strict, layout, pdf, write, usage, internal.
 * Results that carry issues include both "issues"/"warnings" (display strings) and
 * "issuesDetail" ([{"severity","blockId","field","message"}]).
 *
 * result_len: 4096 bytes is plenty for a success result; reports with many warnings need
 * more. On RB_ERR_BUFFER, call again with a bigger buffer.
 *
 * Data may contain bare NaN / Infinity / -Infinity tokens (as LabVIEW emits them).
 */
#ifndef REPORTBUILDER_H
#define REPORTBUILDER_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define RB_OK 0
#define RB_ERR_USAGE 1
#define RB_ERR_VALIDATION 2
#define RB_ERR_RENDER 3
#define RB_ERR_BUFFER (-1)
#define RB_ERR_INTERNAL (-2)

/* Writes the library version (e.g. "1.0.0"). */
int32_t rb_version(char *buf, int32_t len);

/*
 * Render a template to a PDF file.
 *   template_path  path to a .rbt.json template
 *   data_json      JSON text; NULL or "" uses the template's sample data
 *   output_pdf     destination file (parent folders are created)
 *   options_json   NULL or e.g. {"pdfa":true,"strict":true,"now":"2026-03-01T10:00:00Z","fontDirs":["C:/fonts"]}
 *   result_json    receives {"ok":true,"output":"...","pages":2,"bytes":81234,"warnings":[],
 *                  "warningCount":0,"issuesDetail":[],"elapsedMs":120}
 *                  or {"ok":false,"stage":"validate|strict|layout|pdf|write|data|template|options",
 *                  "error":"...","issues":[...],"issuesDetail":[...]}
 */
int32_t rb_render(const char *template_path, const char *data_json, const char *output_pdf,
                  const char *options_json, char *result_json, int32_t result_len);

/* Same as rb_render, but reads the data from a file: JSON, or CSV when the path ends in .csv. */
int32_t rb_render_file(const char *template_path, const char *data_path, const char *output_pdf,
                       const char *options_json, char *result_json, int32_t result_len);

/* Validate a template (and optionally data).
 * Result: {"ok","errors","warnings","fields","issuesDetail"}; on failure also "stage" and "error". */
int32_t rb_validate(const char *template_path, const char *data_json, char *result_json, int32_t result_len);

/* Render to memory. Free *out_pdf with rb_free(*out_pdf, *out_len).
 * Validates and honours "strict" like rb_render. Relative image paths resolve against the
 * "baseDir" option. Result as rb_render, without "output". */
int32_t rb_render_to_memory(const char *template_json, const char *data_json, const char *options_json,
                            uint8_t **out_pdf, size_t *out_len, char *result_json, int32_t result_len);

void rb_free(uint8_t *ptr, size_t len);

#ifdef __cplusplus
}
#endif

#endif /* REPORTBUILDER_H */
