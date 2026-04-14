# Formulas

The engine evaluates Excel/Sheets-style formulas entered with a leading `=`. Parser and evaluator are custom — no third-party dependency.

## Basics

```
=A1+B1              addition
=SUM(A1:A10)        range aggregate
=IF(A1>100, "hi", "lo")   logic
=Sheet2!B3          cross-sheet reference
=A1 & " " & B1      string concatenation
```

## Operators

| Operator | Meaning |
|----------|---------|
| `+` `-` `*` `/` `^` | Arithmetic (`^` = power) |
| `=` `<>` `<` `<=` `>` `>=` | Comparison |
| `&` | String concatenation |
| `%` | Percentage (`50%` = 0.5) |
| `()` | Grouping |

## Error Values

| Value | Cause |
|-------|-------|
| `#ERROR!` | Syntax error in formula |
| `#VALUE!` | Wrong argument type |
| `#DIV/0!` | Division by zero |
| `#NAME?` | Unknown function |
| `#CIRC!` | Circular reference |

## Reference Forms

- `A1` — single cell
- `A1:B5` — range
- `Sheet2!A1` — cell on another sheet
- `Sheet2!A1:B5` — range on another sheet

## Built-in Functions (80+)

### Math (25)

| Function | Purpose |
|----------|---------|
| `SUM(range)` | Sum of numbers |
| `AVERAGE(range)` | Arithmetic mean |
| `MEDIAN(range)` | Median value |
| `MIN(range)` / `MAX(range)` | Min / max |
| `COUNT(range)` | Count of numeric cells |
| `PRODUCT(range)` | Product of numbers |
| `ROUND(n, digits)` | Round to `digits` decimals |
| `ABS(n)` | Absolute value |
| `SQRT(n)` | Square root |
| `POWER(base, exp)` | `base^exp` |
| `MOD(a, b)` | Remainder |
| `INT(n)` / `TRUNC(n)` | Truncate to int |
| `FLOOR(n)` / `CEILING(n)` | Round down / up |
| `SIGN(n)` | `-1`, `0`, or `1` |
| `FACT(n)` | Factorial |
| `PI()` | 3.14159… |
| `EXP(n)` | `e^n` |
| `LN(n)` / `LOG(n, base?)` / `LOG10(n)` | Logarithms |
| `RAND()` | 0 ≤ x < 1 |
| `RANDBETWEEN(lo, hi)` | Integer in range |

### Text (19)

| Function | Purpose |
|----------|---------|
| `UPPER(s)` / `LOWER(s)` / `PROPER(s)` | Case conversion |
| `LEN(s)` | String length |
| `TRIM(s)` | Strip leading/trailing whitespace |
| `LEFT(s, n)` / `RIGHT(s, n)` / `MID(s, start, n)` | Substrings |
| `FIND(needle, haystack, start?)` | Case-sensitive position |
| `SEARCH(needle, haystack, start?)` | Case-insensitive position |
| `SUBSTITUTE(s, old, new, occurrence?)` | Replace |
| `REPLACE(s, start, count, new)` | Positional replace |
| `CONCAT(...args)` | Join strings |
| `REPT(s, n)` | Repeat |
| `EXACT(a, b)` | Case-sensitive equality |
| `VALUE(s)` | String → number |
| `TEXT(n, fmt)` | Number → formatted string |
| `CHAR(code)` / `CODE(s)` | Code ↔ character |

### Logic (8)

| Function | Purpose |
|----------|---------|
| `IF(cond, then, else)` | Conditional |
| `AND(...args)` / `OR(...args)` / `NOT(a)` | Boolean |
| `IFERROR(val, fallback)` | Catch errors |
| `IFBLANK(val, fallback)` | Blank-cell fallback |
| `SWITCH(expr, case1, val1, ..., default?)` | Multi-branch |
| `CHOOSE(index, v1, v2, ...)` | Pick by 1-based index |

### Conditional Aggregates (8)

| Function | Purpose |
|----------|---------|
| `SUMIF(range, criterion, sumRange?)` | Sum matching |
| `SUMIFS(sumRange, r1, c1, ...)` | Multi-criteria sum |
| `COUNTIF(range, criterion)` | Count matching |
| `COUNTIFS(r1, c1, ...)` | Multi-criteria count |
| `AVERAGEIF(range, criterion, avgRange?)` | Average matching |
| `AVERAGEIFS(avgRange, r1, c1, ...)` | Multi-criteria average |
| `MINIFS(minRange, r1, c1, ...)` | Min matching |
| `MAXIFS(maxRange, r1, c1, ...)` | Max matching |

Criteria support operators as strings: `">100"`, `"<=50"`, `"<>"`, `"=apple"`.

### Lookup (8)

| Function | Purpose |
|----------|---------|
| `VLOOKUP(value, range, colIndex, exact?)` | Vertical lookup |
| `HLOOKUP(value, range, rowIndex, exact?)` | Horizontal lookup |
| `INDEX(range, row, col?)` | Index into a range |
| `MATCH(value, range, type?)` | Find position |
| `ROWS(range)` / `COLUMNS(range)` | Dimensions |
| `ROW(ref?)` / `COLUMN(ref?)` | Position of a ref |

### Date / Time (12)

| Function | Purpose |
|----------|---------|
| `TODAY()` | Current date |
| `NOW()` | Current date + time |
| `DATE(y, m, d)` | Build a date |
| `YEAR(date)` / `MONTH(date)` / `DAY(date)` | Extract parts |
| `HOUR(t)` / `MINUTE(t)` / `SECOND(t)` | Extract time parts |
| `WEEKDAY(date, type?)` | Day of week |
| `DATEDIF(start, end, unit)` | Difference (`"Y"`, `"M"`, `"D"`) |
| `EDATE(start, months)` | Offset by months |

### Info (6)

| Function | Purpose |
|----------|---------|
| `ISBLANK(ref)` | Cell is empty |
| `ISNUMBER(val)` / `ISTEXT(val)` / `ISLOGICAL(val)` | Type checks |
| `ISERROR(val)` | Is an error value |
| `TYPE(val)` | Type code (1=number, 2=text, 4=logical, 16=error) |

## Registering Custom Functions

```tsx
import { registerFunction } from "@particle-academy/fancy-sheets";

registerFunction("GREET", (name: string) => `Hello, ${name}`);

// In a cell: =GREET("world")  →  "Hello, world"
```

Custom functions are called with resolved arguments (cell values, not tokens). Return any `CellValue`. Throwing is allowed — the value becomes `#ERROR!` in the grid.

## Dependency Tracking

The evaluator builds a dependency graph between cells. When a cell changes, only transitively dependent cells are re-evaluated, in topological order. Circular references are detected and reported as `#CIRC!`.
