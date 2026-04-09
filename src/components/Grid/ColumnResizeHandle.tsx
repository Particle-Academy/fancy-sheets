import { useCallback, useRef } from "react";
import { useSpreadsheet } from "../Spreadsheet/Spreadsheet.context";

interface ColumnResizeHandleProps {
  colIndex: number;
}

export function ColumnResizeHandle({ colIndex }: ColumnResizeHandleProps) {
  const { resizeColumn, getColumnWidth } = useSpreadsheet();
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startX.current = e.clientX;
      startWidth.current = getColumnWidth(colIndex);
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);

      const handlePointerMove = (ev: PointerEvent) => {
        const delta = ev.clientX - startX.current;
        resizeColumn(colIndex, startWidth.current + delta);
      };

      const handlePointerUp = () => {
        target.removeEventListener("pointermove", handlePointerMove);
        target.removeEventListener("pointerup", handlePointerUp);
      };

      target.addEventListener("pointermove", handlePointerMove);
      target.addEventListener("pointerup", handlePointerUp);
    },
    [colIndex, getColumnWidth, resizeColumn],
  );

  return (
    <div
      data-fancy-sheets-resize-handle=""
      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500/50"
      onPointerDown={handlePointerDown}
    />
  );
}

ColumnResizeHandle.displayName = "ColumnResizeHandle";
