import { Button } from "@/components/ui/button";
import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignStartVertical,
  AlignCenterVertical,
} from "lucide-react";
import type { FabricObject } from "fabric";

interface AlignmentToolbarProps {
  canvasWidth: number;
  canvasHeight: number;
  displayScale: number;
  selectedObjects: FabricObject[];
  onAlign: (
    mode:
      | "left"
      | "center"
      | "right"
      | "top"
      | "middle"
      | "bottom"
      | "distributeH"
      | "distributeV"
  ) => void;
}

export function AlignmentToolbar({
  canvasWidth,
  canvasHeight,
  displayScale,
  selectedObjects,
  onAlign,
}: AlignmentToolbarProps) {
  const w = canvasWidth * displayScale;
  const h = canvasHeight * displayScale;
  const hasSelection = selectedObjects.length > 0;
  const hasMultiple = selectedObjects.length > 1;

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 p-1.5 min-w-fit overflow-visible">
      <span className="mr-1 px-1 text-xs text-muted-foreground shrink-0">Align</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title="Align left"
        disabled={!hasSelection}
        onClick={() => onAlign("left")}
      >
        <AlignHorizontalJustifyStart className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title="Align center"
        disabled={!hasSelection}
        onClick={() => onAlign("center")}
      >
        <AlignHorizontalJustifyCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title="Align right"
        disabled={!hasSelection}
        onClick={() => onAlign("right")}
      >
        <AlignHorizontalJustifyEnd className="h-4 w-4" />
      </Button>
      <div className="mx-0.5 w-px bg-border" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title="Align top"
        disabled={!hasSelection}
        onClick={() => onAlign("top")}
      >
        <AlignVerticalJustifyStart className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title="Align middle"
        disabled={!hasSelection}
        onClick={() => onAlign("middle")}
      >
        <AlignVerticalJustifyCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title="Align bottom"
        disabled={!hasSelection}
        onClick={() => onAlign("bottom")}
      >
        <AlignVerticalJustifyEnd className="h-4 w-4" />
      </Button>
      {hasMultiple && (
        <>
          <div className="mx-0.5 w-px bg-border" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Distribute horizontally"
            onClick={() => onAlign("distributeH")}
          >
            <AlignStartVertical className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Distribute vertically"
            onClick={() => onAlign("distributeV")}
          >
            <AlignCenterVertical className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
