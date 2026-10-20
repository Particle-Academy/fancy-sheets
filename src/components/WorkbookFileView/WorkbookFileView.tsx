import { useMemo } from "react";
import { Callout, FauxClient, type FauxClientProps } from "@particle-academy/react-fancy";
import { SheetWorkbook } from "../SheetWorkbook/SheetWorkbook";
import { isWorkbookRead, workbookFromRead } from "../../utils/workbook-from-read";

export interface WorkbookFileViewProps {
  /** A workbook as holy-sheet's reader returns it. */
  document: unknown;
  filename?: string;
  /** Passed to the FauxClient frame. */
  frameProps?: Partial<FauxClientProps>;
}

/**
 * An .xlsx in fancy-code's `FileViewer`: register it once at app start.
 *
 * ```ts
 * registerOfficeViewer("xlsx", WorkbookFileView, { read: (b) => new XlsxReader().describe(b) });
 * ```
 *
 * Read-only, in the FauxClient frame every file viewer carries (zoom and full
 * screen, revealed on hover), with the sheet tabs and no editing toolbar. The
 * props match fancy-code's `OfficeViewerProps` without importing them, so this
 * package does not depend on fancy-code.
 */
export function WorkbookFileView({ document, filename, frameProps }: WorkbookFileViewProps) {
  const data = useMemo(() => (isWorkbookRead(document) ? workbookFromRead(document) : null), [document]);

  // A reader that returned something else would otherwise draw an empty grid.
  if (!data) {
    return <Callout color="red">{filename ?? "This file"} did not read as a workbook.</Callout>;
  }

  return (
    <FauxClient variant="device" controls fill {...frameProps}>
      {/* Keyed by the data, so a new file starts on its own first sheet. */}
      <SheetWorkbook key={filename ?? ""} defaultData={data} readOnly hideToolbar className="h-full" />
    </FauxClient>
  );
}
