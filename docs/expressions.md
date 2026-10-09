# Expressions and data binding

Templates read data through a small, safe expression language. It can't run arbitrary code or
touch files, and a missing field evaluates to empty rather than failing. Missing fields are
reported as warnings, which become errors with `--strict`.

## Where expressions go

- **Text fields** (headings, text, labels, key/value values, QR/barcode content) are literal text
  with `{{ expression }}` holes: `Serial {{ dut.serial }}, tested {{ date(test.start, 'D MMM YYYY') }}`.
- **Data fields** (table sources, column values, chart series, status values, "Show if", "Repeat for")
  are plain expressions: `measurements`, `row.value * 1000`, `status == 'FAIL'`.

The editor autocompletes fields from the active data set, and loop variables such as `row`, `item`
and your section's alias. Press **Ctrl+Space** to open suggestions manually.

## Syntax

| Form | Example |
|---|---|
| Path | `dut.serial`, `channels[0].name`, `results[-1]`, `list.length` |
| Legacy prefix | `data.dut.serial` (the `data.` prefix is optional) |
| Literals | `42`, `1.5e-3`, `'text'`, `"text"`, `true`, `null`, `[1, 2]` |
| Arithmetic | `+ - * / %` (`+` also joins text) |
| Comparison | `== != < <= > >=` (`===`/`!==` accepted; `'5' == 5` is true; numeric text compares as numbers, so `'10' > '9'`) |
| Logic | `&& \|\| !` or `and or not` |
| Conditional | `ok ? 'PASS' : 'FAIL'` |
| Fallback | `operator ?? 'unknown'` |
| Pipe | `vbus \| fixed(3)` is the same as `fixed(vbus, 3)` |

## Built-in variables

| Name | Value |
|---|---|
| `page`, `pages` | Current page and page count (in text: `Page {{ page }} of {{ pages }}`) |
| `report.name`, `report.revision`, `report.author`, `report.generatedAt` | From the template, and the render time |
| `theme.company` | From the brand kit |
| `row`, `index`, `number` | Inside table columns and row tints (`number` is 1-based) |
| `item`, `index`, `number` | Inside chart series |
| *alias*, `index`, `number` | Inside a repeated section (alias defaults to `item`) |
| *computed fields* | Every name in the template's `vars`, e.g. `{{ failures }}` |

Page numbers are only known after layout, so `page` and `pages` work on their own in text
(`{{ page }}`), not inside larger expressions; validation warns about `{{ page + 1 }}`.

## Functions

**Numbers**: `fixed(x, n)` (text with n decimals), `round(x, n)`, `floor`, `ceil`, `abs`, `sqrt`,
`percent(ratio, n)` (`0.934` → `93.4 %`), `si(x, 'V', n)` (`0.0047` → `4.7 mV`),
`pad(n, width)` (`007`), `number(x)`.

**Lists**: `len`, `sum(list, 'field')`, `avg`, `min`, `max`, `stdev`, `cpk(values, low, high)`,
`first`, `last`, `sort(list, 'field')`, `reverse`, `unique`, `slice(list, start, end)`,
`pluck(list, 'field')`, `join(list, ', ')`, `where(list, 'field', value)`,
`count_if(list, 'field', value)`, `range(n)`, `keys(obj)`, `entries(obj)`,
`count_by(list, 'field')` (a Pareto: `[{key, count}]`, most frequent first),
`group_by(list, 'field')` (`[{key, count, items}]`, in first-seen order).

**Per-item expressions**: the second argument is an expression string evaluated with `it` as the
current item:
`each(list, 'it.value * 1000')`, `select(list, 'it.value > 3')`, `count(list, "it.status == 'FAIL'")`,
`any(list, 'it.retest')`, `all(list, 'it.ok')`.

**Verdicts**: `verdict(x)` normalises PASS/FAIL/WARN/SKIP, accepting `true`, `OK`, `NG`, `Passed`
and similar spellings. `verdict(list, 'status')` rolls a list up: any FAIL gives FAIL. When a row
has no status field, it is judged from `value` against `low`/`high`. `status(value, low, high)`
returns PASS/FAIL, and a NaN value is a FAIL; `status(value, low, high, 0.05)` returns WARN for a
pass within 5 % of the limit span from a limit. `in_range(v, lo, hi)`. `pass_rate(list, 'status')`
returns 0–1.

**Limits and units**: `limits(low, high, 'V', 2)` gives `4.75 … 5.25 V`, `≥ 4.75 V` or `≤ 5.25 V`
depending on which limits exist (NaN/Inf count as none). `with_unit(value, 'V', 3)` gives
`4.988 V`, and is empty when the value is missing.

**Text**: `upper`, `lower`, `trim`, `replace(s, from, to)`, `contains(s, part)`, `concat(a, b, …)`,
`split(s, ',')`, `string(x)`, `default(x, fallback)` (also treats empty text as missing, unlike
`??`), `if(cond, a, b)`.

**Dates**: `now()`, `date(x, format)`, `duration(seconds)` (`3 min 05 s`), `lvtime(seconds)`
(a LabVIEW timestamp as an ISO date).
`x` may be an ISO 8601 string, a `YYYY-MM-DD[ HH:MM[:SS]]` string, Unix seconds/milliseconds, or a
LabVIEW timestamp (seconds since 1904: numbers from 2.9e9 to 1e11 are read that way).
The original UTC offset is kept. `date()` is the render date; `date(x)` of a missing `x` is empty,
not today.

Calling a function that does not exist gives an empty value; validation reports it with the
closest real name.

| Token | Output | Token | Output |
|---|---|---|---|
| `YYYY` / `YY` | 2026 / 26 | `HH` / `H` | 14 / 14 |
| `MMMM` / `MMM` | March / Mar | `hh` / `h` | 02 / 2 |
| `MM` / `M` | 03 / 3 | `mm`, `ss` | minutes, seconds |
| `DD` / `D` | 01 / 1 | `A` | AM/PM |
| `dddd` / `ddd` | Sunday / Sun | `Z` | +01:00 |

Text in square brackets is printed literally: `date(t, 'D MMM [at] HH:mm')`.

## Rich text

Text blocks support `**bold**`, `*italic*`, `` `monospace` ``, a line break (newline) and a new
paragraph (blank line). Values inserted with `{{ }}` are never interpreted as formatting.
