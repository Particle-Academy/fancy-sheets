# Contributing to @particle-academy/fancy-sheets

Notes for anyone, human or agent, working ON this package's code. How to USE the
package is in [AGENTS.md](./AGENTS.md); what it is, is in [README.md](./README.md).
`CLAUDE.md` is a symlink to this file, so Claude Code reads these notes when it
works in this repo.

## Commands

```bash
npm run build   # tsup (ESM + CJS + DTS)
npm run dev     # watch mode
npm run lint    # tsc --noEmit && eslint .
npm test        # vitest run
npm run clean   # remove dist/
```

## Layout

- `src/engine/` — the formula lexer, parser, evaluator, recalc and CSV code.
  It is pure: no React, no DOM, so it can be exported as the headless engine.
- `src/components/`, `src/hooks/` — the React surface.
- `tests/` and `src/**/*.test.ts(x)` — vitest suites. The default environment
  is `node`; a DOM suite opts in per file with `@vitest-environment jsdom`.
- `docs/` ships in the package; update the matching doc when an API changes.

The package has zero third-party runtime dependencies (custom lexer, parser,
evaluator and dependency graph).

## Changelog

Update `CHANGELOG.md` in the same commit as the change.
