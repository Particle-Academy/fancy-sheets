# Changelog

All notable changes to `@particle-academy/fancy-sheets` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **0.9.0 is missing below.** This file was last updated at 0.8.0; `git log` is
> the record for that release. Noted rather than back-filled from memory.

## [Unreleased]

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
