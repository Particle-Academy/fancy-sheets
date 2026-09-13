// Regenerates tests/fixtures/libreoffice/*.json: what LibreOffice DISPLAYS and
// COMPUTES for the cases in probes.php. The display, TEXT() and date-function
// tests compare against these files, so every expectation there was produced by
// a spreadsheet application rather than written down from memory.
//
//   node scripts/libreoffice-goldens/build.mjs
//
// Needs PHP with a holy-sheet checkout that has run `composer install`
// (HOLY_SHEET_PHP_SRC, default ../holy-sheet) and LibreOffice (SOFFICE, default
// the standard install path on Windows, else `soffice` on PATH).

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const holySheet = resolve(process.env.HOLY_SHEET_PHP_SRC ?? join(repo, "../holy-sheet"));
const soffice =
  process.env.SOFFICE ??
  (process.platform === "win32" ? "C:/Program Files/LibreOffice/program/soffice.com" : "soffice");

const work = mkdtempSync(join(tmpdir(), "fancy-sheets-lo-"));
const fixtures = join(repo, "tests/fixtures/libreoffice");

try {
  const meta = JSON.parse(execFileSync("php", [join(here, "probes.php"), holySheet, work], { encoding: "utf8" }));

  const libreoffice = execFileSync(soffice, ["--version"], { encoding: "utf8" }).trim().split(/\s+/).slice(0, 2).join(" ");
  // Tab-separated, UTF-8, cell contents AS SHOWN (the last token).
  execFileSync(soffice, [
    `-env:UserInstallation=${pathToFileURL(join(work, "profile")).href}`,
    "--headless",
    "--convert-to",
    "csv:Text - txt - csv (StarCalc):9,34,76,1,,1033,false,true,true",
    "--outdir",
    work,
    ...["display", "text", "datetime"].map((name) => join(work, `${name}.xlsx`)),
  ]);

  const table = (name) => parseTsv(readFileSync(join(work, `${name}.csv`), "utf8")).slice(1);
  const provenance = {
    generatedBy: "scripts/libreoffice-goldens/build.mjs",
    libreoffice,
    note: "Every value below is what LibreOffice produced. Do not edit by hand; regenerate.",
  };

  mkdirSync(fixtures, { recursive: true });

  const display = table("display");
  writeJson("display.json", {
    ...provenance,
    values: meta.display.values,
    columns: meta.display.columns.map((column, c) => ({ ...column, shown: display.map((row) => row[c]) })),
  });

  const text = table("text");
  writeJson("text.json", {
    ...provenance,
    values: meta.text.values,
    codes: meta.text.codes,
    shown: text.map((row) => row.slice(1)),
  });

  const datetime = table("datetime");
  writeJson("datetime.json", {
    ...provenance,
    cases: meta.datetime.formulas.map((formula, i) => {
      const shown = datetime[i][1];
      const number = Number(shown.replace(/,/g, ""));
      return { formula, result: shown !== "" && Number.isFinite(number) ? number : shown };
    }),
  });
} finally {
  rmSync(work, { recursive: true, force: true });
}

function writeJson(name, data) {
  writeFileSync(join(fixtures, name), JSON.stringify(data, null, 2) + "\n");
  console.log(`wrote tests/fixtures/libreoffice/${name}`);
}

/** RFC 4180 quoting with tab separators. */
function parseTsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === "\t") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
