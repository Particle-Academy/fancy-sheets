import { cn, FullScreenToggle, type FullScreenToggleProps } from "@particle-academy/react-fancy";

/**
 * The full-screen toggle for the enclosing `<Spreadsheet>`, sized for its dense
 * toolbar. The default toolbar already carries one; this is for custom chrome.
 * It is react-fancy's `FullScreen.Toggle`, so it renders nothing outside a
 * `<Spreadsheet>`.
 */
export function SpreadsheetFullScreenToggle({ className, ...props }: FullScreenToggleProps) {
  return <FullScreenToggle {...props} data-fancy-sheets-fullscreen-toggle="" className={cn("h-6 w-6", className)} />;
}

SpreadsheetFullScreenToggle.displayName = "SpreadsheetFullScreenToggle";
