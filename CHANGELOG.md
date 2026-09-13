# Changelog

All notable changes to `@particle-academy/fancy-sheets` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **0.9.0 is missing below.** This file was last updated at 0.8.0; `git log` is
> the record for that release. Noted rather than back-filled from memory.

## [Unreleased]

## [0.11.0] — 2026-09-13

> Pre-1.0: a breaking change lands in a MINOR release. Each one below says what to do.

### Fixed

- **A formatted number now displays as a spreadsheet application displays it.** Each `displayFormat` renders through the format code holy-sheet writes into an `.xlsx` for the same format, so the grid and the exported file agree. Against LibreOffice 26.2, the previous display got 91 of 160 formatted cells wrong:
  - `currency` was always `$`, ignored the cell's currency and had no thousands separator: `1250000.5` showed `$1250000.50` for a cell the file formats as `€1,250,000.50`.
  - Rounding went through `toFixed`, so `1.005` at two places showed `1.00`. It is now half away from zero on the decimal value (`1.01`).
  - A negative that rounds to zero showed `-0.00` under a single-section format.
- **`TEXT()` understands format codes.** It knew `%` and a decimal point and returned 351 of 427 probed results differently from LibreOffice. It now handles digit placeholders (`0 # ?`), grouping and scaling commas, `%`, scientific notation, quoted and escaped text, positive/negative/zero sections, and date and time codes (`yyyy-mm-dd`, `mmmm d, yyyy`, `dddd`, `h:mm AM/PM`, `hh:mm:ss`). A date past 9999-12-31 is `#VALUE!`. Fractions (`# ?/?`) and elapsed time (`[h]`) are not supported.
- **Dates no longer depend on the browser's time zone.** Serial dates were computed in local time against a local 1899 epoch:
  - In America/Chicago in summer, and in Asia/Kolkata all year, `DATE(2023,7,16)` returned 45122 instead of 45123.
  - In Pacific/Apia every date cell showed the next day.
  - `DAY("2026-01-15")`, the string holy-sheet reads a date cell back as, was 14 in America/Chicago.

  Every date function and the date display now use the calendar date; only `TODAY()` and `NOW()` read the local clock.
- **`HOUR`, `MINUTE` and `SECOND` no longer truncate binary error**: `MINUTE(2.675)` is 12, not 11.
- **`EDATE` clamps to the end of a shorter month**: Jan 31 + 1 month is Feb 28, not Mar 3.
- **`DATEDIF` counts complete months and years**: Jan 31 to Feb 1 is 0 months, not 1.
- **`WEEKDAY` return type 3 counts from Monday** (0 = Monday), as documented. Types 11–17 are supported; any other type is `#NUM!`.

### Added

- `CellFormat.currency`: an ISO 4217 code for `currency` display, default `USD`. The symbols are holy-sheet's, so a workbook holy-sheet reads back keeps its currency.
- `formatCellValue(value, cell)`, `displayFormatCode(format)`, `defaultDecimals(displayFormat)`, `formatWithCode(value, code)` and `currencySymbol(iso)` are exported, pure and React-free, for rendering a cell's text outside the grid.

### Changed

- **BREAKING: `displayFormat: "number"` without `decimals` shows 0 places, grouped** (`1234.567` shows `1,235`). It used to show the raw value, while holy-sheet wrote the same cell into a file as `#,##0`. **What to do:** if you want places, set `decimals`. If you want the raw value, use `displayFormat: "auto"`.
- The toolbar's decimal-places stepper counts from the places a format shows by default (2 for currency, 1 for a percentage) rather than from the raw value's digits.

Every expectation behind these fixes was produced by LibreOffice, not written from memory: `scripts/libreoffice-goldens/build.mjs` writes the cases through holy-sheet, LibreOffice displays or computes them, and the tests compare against `tests/fixtures/libreoffice/`. The exceptions are `A/P`, where the case follows the code as Microsoft documents (LibreOffice always writes lower case), and `DATE(23,1,1)`, which stays 1923 (Excel's rule and this package's behaviour until now) where LibreOffice windows it to 2023.

## [0.10.0] — 2026-08-07

### Changed

- **BREAKING — Node 22 is now declared as the floor.** `engines.node` is `>=22`, where this package previously declared **nothing at all**.

  Declaring nothing was not the same as supporting old Node: a consumer on 18 installed cleanly and found out at runtime.

  **What you must do:** on Node 22 or newer, nothing. Note npm only *warns* on an `engines` mismatch while **pnpm fails the install**, so this surfaces differently depending on your package manager. Node 18 is end-of-life and 20 is maintenance-only.

- **BREAKING — React 18 is no longer supported.** `peerDependencies.react` / `react-dom` are now `^19.0.0`.

  **What you must do:** on React 19, nothing. On React 18, stay on the previous release, or upgrade your app to 19 first.

  React 18 support was a claim nothing tested — every build and test in this package ran against 19, so the 18 half of the old range was never executed. An untested compatibility claim is worse than an absent one, because it reads as support.

### Why

These are the kit 0.5 platform floors, applied across every package at once so a consumer never has to resolve a mix. **No API changed, nothing was removed, nothing was renamed** — only what the package requires.


## [0.9.3] — 2026-07-27

### Security

- **esbuild forced to >= 0.28.1** ([GHSA-g7r4-m6w7-qqqr] — arbitrary file read
  via the esbuild dev server on Windows, low severity). esbuild reaches this
  repo only as a build-time transitive of `tsup` and `vitest`, both
  devDependencies, so **nothing shipped in the published package was affected
  and no consumer was ever exposed** — this closes the alert on the repo's own
  dev tree.

  The fix is an `overrides` entry rather than a dependency bump because there is
  nothing to bump to: `tsup@8.5.1` (latest) ranges `esbuild: ^0.27.0`, and no
  patched 0.27.x exists — the fix first shipped in esbuild 0.28.1. The override
  installs the *patched* esbuild, it does not suppress the finding. **Remove it
  once tsup ships an esbuild >= 0.28.1 range.**

### Consumers

- **Nothing to do.** The change is devDependency-tree only; the published
  `dist/` is byte-identical in behaviour to 0.9.2.

## [0.9.2] — 2026-07-27

### Fixed

- **The format picker stretched across the whole toolbar.** react-fancy's
  `<Select>` is full-width by default; the bare `<select>` it replaced in 0.9.1
  was `h-6` and content-sized. Constrained to `w-36`. Caught by looking at the
  rendered toolbar — the six new tests assert names and roles, and none of them
  can see a control that is too wide.

## [0.9.1] — 2026-07-27

### Fixed

- **Nothing in the toolbar or the sheet tabs had an accessible name.** Every
  toolbar button contains a bare `<svg>` and carried only a `title`, which is
  not a reliable accessible name — so a screen reader announced eleven controls
  as "button". The **format picker was a `<select>` with no label of any kind**,
  and the formula bar — the most-used control in the component — had none either.

- **The sheet tabs were a row of plain buttons with no tab semantics**, so
  nothing announced which sheet was active. They are now a `role="tablist"` of
  `role="tab"` with `aria-selected`, and each carries a `data-fancy-sheet-tab`
  handle keyed by sheet id — the stable identity the Human+ contract asks for,
  so an agent switches sheets by id rather than by counting DOM children.

  **Nothing to do.** No prop changed; controls gained attributes.

### Changed

- **Toolbar buttons are `<Button variant="ghost" size="xs">` from react-fancy.**
  The hand-written `btnClass` spelled out — padding, hover, disabled fade —
  exactly what react-fancy's ghost variant already provides, so the swap is
  dimensionally identical on a dense, size-sensitive toolbar and picks up the
  shared focus ring. react-fancy was already a required peer; this package had
  been importing it only for the `cn` helper.

  The **grid is deliberately untouched**. A spreadsheet cell is not a
  react-fancy primitive, and hand-rolling it is correct — only the chrome was
  ever a candidate.

### Added

- **jsdom, a vitest config, and the package's first component tests.** There was
  one suite — pure logic, in `src/hooks/` — and no jsdom at all, so not one of
  the 12 React components could be rendered and inspected. That is how an
  unlabelled format picker went unnoticed. Six new tests; all six fail against
  the previous code, and one of them caught two freeze buttons this change had
  missed.

## [0.8.0] — 2026-06-07

Expose the formula engine for headless / Node use, and document the patterns
external consumers most need. ([#2](https://github.com/Particle-Academy/fancy-sheets/issues/2))

### Added
- **Headless formula engine exports** — the recalculation and formula functions
  are now exported from the package entry as pure, React-free, Node-safe
  functions:
  - `recalculateWorkbook(workbook): WorkbookData`
  - `recalculateSheet(sheet, allSheets?): SheetData`
  - `lexFormula(input): FormulaToken[]`
  - `parseFormula(tokens): FormulaASTNode`
  - `evaluateAST(node, getCellValue, getRangeValues, ctx?): CellValue`
  - plus the supporting types `FormulaToken`, `FormulaTokenType`, `FormulaASTNode`,
    `CellValueGetter`, `RangeValueGetter`, `SheetCellValueGetter`,
    `SheetRangeValueGetter`, `EvaluatorContext`.
- **Recipe docs** — `docs/recipes/`: `headless-recalc.md`, `external-state-sync.md`,
  `custom-functions.md`, `csv-roundtrip.md`.

### Changed
- `recalculateWorkbook` / `recalculateSheet` were extracted from
  `hooks/use-spreadsheet-store.ts` into a new pure module `engine/recalc.ts`. The
  React store imports them from there; behavior is identical. This is what makes
  them importable in Node without pulling in React.

### Compatibility
- No breaking changes — additive exports only. Still zero third-party runtime deps.

## [0.7.6] — earlier

Fix: an externally-replaced `data` prop now recalculates formulas correctly
(`SET_WORKBOOK` runs the recalc pass). See [#1](https://github.com/Particle-Academy/fancy-sheets/issues/1).

[GHSA-g7r4-m6w7-qqqr]: https://github.com/advisories/GHSA-g7r4-m6w7-qqqr
