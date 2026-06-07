# Changelog

All notable changes to `@particle-academy/fancy-sheets` are documented here.

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
