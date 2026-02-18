import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Move } from "lucide-react";
import type { FabricObject } from "fabric";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface TransformControlsProps {
  selectedObject: FabricObject | null;
  displayScale: number;
  onTransformChange: (
    key: "left" | "top" | "width" | "height" | "angle",
    value: number
  ) => void;
  lockAspectRatio: boolean;
  onLockAspectRatioChange: (locked: boolean) => void;
}

export function TransformControls({
  selectedObject,
  displayScale,
  onTransformChange,
  lockAspectRatio,
  onLockAspectRatioChange,
}: TransformControlsProps) {
  const [open, setOpen] = useState(true);

  if (!selectedObject) return null;

  const left = Math.round((selectedObject.left ?? 0) / displayScale);
  const top = Math.round((selectedObject.top ?? 0) / displayScale);
  const w = selectedObject.getScaledWidth();
  const h = selectedObject.getScaledHeight();
  const width = Math.round(w / displayScale);
  const height = Math.round(h / displayScale);
  const angle = Math.round(selectedObject.angle ?? 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="pt-2">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md py-1.5 text-left text-sm font-medium hover:bg-primary/5"
          >
            <Move className="h-4 w-4 text-primary" />
            Transform
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <Label className="text-muted-foreground">X (px)</Label>
              <Input
                type="number"
                value={left}
                onChange={(e) =>
                  onTransformChange("left", Number(e.target.value))
                }
                className="mt-0.5 h-8 bg-secondary/50"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Y (px)</Label>
              <Input
                type="number"
                value={top}
                onChange={(e) =>
                  onTransformChange("top", Number(e.target.value))
                }
                className="mt-0.5 h-8 bg-secondary/50"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Width</Label>
              <Input
                type="number"
                value={width}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v > 0) onTransformChange("width", v);
                }}
                className="mt-0.5 h-8 bg-secondary/50"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Height</Label>
              <Input
                type="number"
                value={height}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v > 0) onTransformChange("height", v);
                }}
                className="mt-0.5 h-8 bg-secondary/50"
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch
                checked={lockAspectRatio}
                onCheckedChange={onLockAspectRatioChange}
              />
              <Label className="text-muted-foreground">Lock aspect ratio</Label>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Rotation (°)</Label>
              <Input
                type="number"
                min={0}
                max={360}
                value={angle}
                onChange={(e) =>
                  onTransformChange("angle", Number(e.target.value))
                }
                className="mt-0.5 h-8 bg-secondary/50"
              />
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

