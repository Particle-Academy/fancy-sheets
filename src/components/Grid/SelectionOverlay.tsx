import { useMemo } from "react";
import { useSpreadsheet } from "../Spreadsheet/Spreadsheet.context";
import { parseAddress, normalizeRange } from "../../engine/cell-utils";

export function SelectionOverlay() {
  const { selection, getColumnWidth, rowHeight } = useSpreadsheet();

  const rects = useMemo(() => {
    return selection.ranges.map((range, i) => {
      const norm = normalizeRange(range.start, range.end);
      const s = parseAddress(norm.start);
      const e = parseAddress(norm.end);

      let left = 48; // row header width
      for (let c = 0; c < s.col; c++) left += getColumnWidth(c);

      let width = 0;
      for (let c = s.col; c <= e.col; c++) width += getColumnWidth(c);

      const top = rowHeight + s.row * rowHeight; // column header height + rows
      const height = (e.row - s.row + 1) * rowHeight;

      return { left, top, width, height, isPrimary: i === 0 };
    });
  }, [selection.ranges, getColumnWidth, rowHeight]);

  return (
    <>
      {rects.map((rect, i) => (
        <div
          key={i}
          data-fancy-sheets-selection=""
          className="pointer-events-none absolute border-2 border-blue-500"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            backgroundColor: rect.isPrimary ? "rgba(59, 130, 246, 0.08)" : "rgba(59, 130, 246, 0.05)",
          }}
        />
      ))}
    </>
  );
}

SelectionOverlay.displayName = "SelectionOverlay";
