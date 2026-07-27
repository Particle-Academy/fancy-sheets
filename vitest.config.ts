import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    /**
     * This package had no DOM test capability at all — one suite, in
     * `src/hooks/`, testing pure logic, and no jsdom in devDependencies. So none
     * of its 12 React components could be rendered and inspected, which is how
     * an unlabelled format picker and a tab strip with no tab semantics went
     * unnoticed.
     *
     * Per-file `@vitest-environment jsdom` opts the DOM suites in and leaves the
     * logic suites on the faster node environment.
     */
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
