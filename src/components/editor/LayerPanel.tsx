import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  GripVertical,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
} from "lucide-react";
import type { FabricObject } from "fabric";
import { IText, FabricImage, Rect, Circle as FabricCircle } from "fabric";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

const LAYER_THUMB_SIZE = 30;

function getLayerIcon(obj: FabricObject) {
  if (obj instanceof IText) return Type;
  if (obj instanceof FabricImage) return ImageIcon;
  if (obj instanceof Rect) return Square;
  if (obj instanceof FabricCircle) return Circle;
  return Square;
}

function getDefaultLayerName(obj: FabricObject, index: number): string {
  if (obj instanceof IText) return `Text ${index + 1}`;
  if (obj instanceof FabricImage) return `Image ${index + 1}`;
  if (obj instanceof Rect) return `Rectangle ${index + 1}`;
  if (obj instanceof FabricCircle) return `Circle ${index + 1}`;
  return `Layer ${index + 1}`;
}

interface LayerPanelProps {
  objects: FabricObject[];
  selectedObject: FabricObject | null;
  displayScale: number;
  onSelect: (obj: FabricObject) => void;
  onDelete: (obj: FabricObject) => void;
  onDuplicate: (obj: FabricObject) => void;
  onVisibilityToggle: (obj: FabricObject, visible: boolean) => void;
  onLockToggle: (obj: FabricObject, locked: boolean) => void;
  onRename: (obj: FabricObject, name: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function LayerPanel({
  objects,
  selectedObject,
  displayScale,
  onSelect,
  onDelete,
  onDuplicate,
  onVisibilityToggle,
  onLockToggle,
  onRename,
  onReorder,
}: LayerPanelProps) {
  const [open, setOpen] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const getLayerName = (obj: FabricObject, index: number) => {
    const custom = (obj as FabricObject & { layerName?: string }).layerName;
    return custom ?? getDefaultLayerName(obj, index);
  };

  const setLayerName = (obj: FabricObject, name: string) => {
    const o = obj as FabricObject & { layerName?: string };
    o.layerName = name || getDefaultLayerName(obj, objects.indexOf(obj));
    onRename(obj, name);
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    onReorder(draggedIndex, index);
    setDraggedIndex(index);
  };
  const handleDragEnd = () => setDraggedIndex(null);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="p-3 glass">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md py-1.5 text-left text-sm font-medium hover:bg-primary/5"
          >
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Layers
            </span>
            <span className="text-xs text-muted-foreground">
              {objects.length}
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-1">
            {objects.map((obj, index) => {
              const id = (obj as FabricObject & { id?: string }).id ?? index.toString();
              const isSelected = selectedObject === obj;
              const visible = obj.visible !== false;
              const locked = obj.selectable === false;
              const Icon = getLayerIcon(obj);
              const name = getLayerName(obj, index);

              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 rounded-md border p-1.5 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:bg-muted/50"
                  } ${draggedIndex === index ? "opacity-50" : ""}`}
                >
                  <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground" />
                  <div
                    className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded border bg-muted/50"
                    title={name}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    value={name}
                    onChange={(e) => setLayerName(obj, e.target.value)}
                    className="h-7 flex-1 min-w-0 text-xs bg-transparent border-0 px-1 focus-visible:ring-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(obj);
                    }}
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded p-0.5 hover:bg-muted"
                    onClick={() => onVisibilityToggle(obj, !visible)}
                    title={visible ? "Hide" : "Show"}
                  >
                    {visible ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="shrink-0 rounded p-0.5 hover:bg-muted"
                    onClick={() => onLockToggle(obj, !locked)}
                    title={locked ? "Unlock" : "Lock"}
                  >
                    {locked ? (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="shrink-0 rounded p-0.5 hover:bg-destructive/10 text-destructive"
                    onClick={() => onDelete(obj)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            {objects.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No layers. Add text or shapes.
              </p>
            )}
          </div>
          <div className="mt-3 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={!selectedObject}
              onClick={() => selectedObject && onDuplicate(selectedObject)}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Duplicate Layer
            </Button>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
