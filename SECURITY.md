# Security policy

## Supported versions

Security fixes are made for the latest release.

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Report them privately through
[GitHub Security Advisories](https://github.com/zeshanabdullah10/ReportBuilder/security/advisories/new).
Include the affected version, steps to reproduce and, if possible, a template or data file that
triggers the problem.

You can expect an acknowledgement within a week. Once a fix is released, the advisory will be
published with credit to the reporter unless you prefer otherwise.

## Scope

Report Builder renders untrusted template and data files, so these are especially relevant:

- Template or data content that escapes the expression language or injects Typst markup
- File-system access beyond what a render needs. The engine reads the template, the data, image
  files a template references (`.png`, `.jpg`, `.gif`, `.svg` and `.webp` only) and font folders
  passed with `--fonts`. It writes only the output path it is given (through a temporary file next
  to it).
- Crashes or memory-safety issues in the C ABI (`reportbuilder.dll` / `.so` / `.dylib`)
- The `report-cli serve` HTTP API reachable from anything other than localhost
