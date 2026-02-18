import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Type, Palette, Upload, Plus, Image as ImageIcon, Trash2, Loader2, Move,
  Layers, ArrowUp, ArrowDown, Square, Circle, Sun, Contrast, Filter
} from "lucide-react";
import { LayerPanel } from "@/components/editor/LayerPanel";
import { TransformControls } from "@/components/editor/TransformControls";
import { AlignmentToolbar } from "@/components/editor/AlignmentToolbar";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { StepHeader } from "@/components/StepHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useBrand, availableFonts } from "@/contexts/BrandContext";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Canvas, FabricImage, IText, FabricObject, Rect, Circle as FabricCircle, filters, Shadow as FabricShadow } from "fabric";

// Extend FabricObject for editor features
declare module 'fabric' {
  interface FabricObject {
    id?: string;
    layerName?: string;
    isBackground?: boolean;
    maskShape?: 'none' | 'circle' | 'rounded-10' | 'rounded-20' | 'rounded-30';
  }
}

// Canvas dimensions
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const DISPLAY_SCALE = 0.5; // Scale for display

function getElementTypeLabel(obj: FabricObject): string {
  if (obj instanceof IText) return 'Text';
  if (obj instanceof FabricImage) return 'Image';
  if (obj instanceof Rect) return 'Rectangle';
  if (obj instanceof FabricCircle) return 'Circle';
  return 'Element';
}

function getElementDisplayName(obj: FabricObject, index: number): string {
  const custom = (obj as FabricObject & { layerName?: string }).layerName;
  if (custom) return custom;
  const type = getElementTypeLabel(obj);
  return `${type} ${index + 1}`;
}

export const Step4 = () => {
  const navigate = useNavigate();
  const { 
    brand, 
    product, 
    generatedImage, 
    setFinalVisualUrl, 
    setFinalVisualBase64,
    setCurrentStep
  } = useBrand();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const backgroundImageRef = useRef<FabricImage | null>(null);
  const [canvasNode, setCanvasNode] = useState<HTMLCanvasElement | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [layersVersion, setLayersVersion] = useState(0);
  const [lockAspectRatio, setLockAspectRatio] = useState(false);
  const [canvasObjects, setCanvasObjects] = useState<FabricObject[]>([]);

  // Advanced editor state
  const [elementOpacity, setElementOpacity] = useState<number>(100);
  const [backgroundBrightness, setBackgroundBrightness] = useState<number>(0);
  const [backgroundContrast, setBackgroundContrast] = useState<number>(0);
  const [backgroundGrayscale, setBackgroundGrayscale] = useState<boolean>(false);

  // Set current step on mount
  useEffect(() => {
    setCurrentStep(4);
  }, [setCurrentStep]);

  // Get brand font family
  const brandFontFamily = availableFonts.find(f => f.name === brand?.font)?.family || 'Outfit, sans-serif';

  // Initialize Fabric.js canvas when the canvas element is in the DOM
  useLayoutEffect(() => {
    if (!canvasNode || fabricCanvasRef.current) return;

    const canvas = new Canvas(canvasNode, {
      width: CANVAS_WIDTH * DISPLAY_SCALE,
      height: CANVAS_HEIGHT * DISPLAY_SCALE,
      backgroundColor: '#1a1a2e',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;

    canvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });
    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });
    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });
    canvas.on('object:added', () => setLayersVersion((v) => v + 1));
    canvas.on('object:removed', () => setLayersVersion((v) => v + 1));
    canvas.on('object:modified', () => setLayersVersion((v) => v + 1));

    setCanvasReady(true);

    return () => {
      setCanvasReady(false);
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [canvasNode]);

  // Load background image: show FULL image (object-fit: contain) – scale to fit, centered, no cropping
  useEffect(() => {
    if (!canvasReady || !generatedImage || !fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    setIsLoading(true);

    const cw = CANVAS_WIDTH * DISPLAY_SCALE;
    const ch = CANVAS_HEIGHT * DISPLAY_SCALE;

    const el = document.createElement('img');
    el.crossOrigin = 'anonymous';
    el.onload = () => {
      const iw = el.naturalWidth || 1;
      const ih = el.naturalHeight || 1;
      el.width = iw;
      el.height = ih;
      // Contain: scale so full image fits inside canvas (no cropping, possible letterboxing)
      const scale = Math.min(cw / iw, ch / ih);
      const scaledW = iw * scale;
      const scaledH = ih * scale;
      const left = (cw - scaledW) / 2;
      const top = (ch - scaledH) / 2;

      const img = new FabricImage(el, {
        width: iw,
        height: ih,
        scaleX: scale,
        scaleY: scale,
        left,
        top,
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      });
      img.id = '__background_image__';
      img.isBackground = true;
      img.setCoords();

      backgroundImageRef.current = img;
      canvas.backgroundImage = img;
      canvas.requestRenderAll();
      setIsLoading(false);
    };
    el.onerror = () => {
      toast.error('Failed to load the generated image');
      setIsLoading(false);
    };
    el.src = generatedImage;
  }, [canvasReady, generatedImage]);

  // Sync layer list when canvas changes (background image is canvas.backgroundImage, not in getObjects())
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    const all = fabricCanvasRef.current.getObjects();
    const filtered = all.filter((obj) => !obj.isBackground);
    setCanvasObjects(filtered);
  }, [layersVersion, canvasReady]);

  // Select an element programmatically (for "Select an element" dropdown)
  const handleSelectElement = useCallback((obj: FabricObject) => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.setActiveObject(obj);
    fabricCanvasRef.current.requestRenderAll();
    setSelectedObject(obj);
  }, []);

  // Update element opacity when selected object changes
  useEffect(() => {
    if (selectedObject) {
      setElementOpacity((selectedObject.opacity || 1) * 100);
    }
  }, [selectedObject]);

  // Redirect if no brand/product context or no generated image
  useEffect(() => {
    if (!brand || !product) {
      toast.warning("Please complete the previous steps first");
      navigate('/step1');
      return;
    }
    if (!generatedImage) {
      toast.warning("Please generate an image first");
      navigate('/step3');
      return;
    }
  }, [brand, product, generatedImage, navigate]);

  // Add text to canvas
  const handleAddText = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const text = new IText('Click to edit', {
      left: (CANVAS_WIDTH * DISPLAY_SCALE) / 2,
      top: (CANVAS_HEIGHT * DISPLAY_SCALE) / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: brandFontFamily.split(',')[0].replace(/"/g, ''),
      fontSize: 48 * DISPLAY_SCALE,
      fill: '#ffffff',
      stroke: 'rgba(0,0,0,0.3)',
      strokeWidth: 1,
      shadow: 'rgba(0,0,0,0.5) 2px 2px 4px',
      textAlign: 'center',
    });

    (text as FabricObject & { id?: string; layerName?: string }).id = `text-${Date.now()}`;
    (text as FabricObject & { layerName?: string }).layerName = 'Text';
    canvas.add(text);
    canvas.setActiveObject(text);
    setLayersVersion((v) => v + 1);
    canvas.requestRenderAll();
    setSelectedObject(text);
    toast.success('Text added! Click to edit.');
  }, [brandFontFamily]);

  // Add logo to canvas: auto-scale to fit within 60% of canvas so full image is always visible
  const handleAddLogo = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const cw = CANVAS_WIDTH * DISPLAY_SCALE;
    const ch = CANVAS_HEIGHT * DISPLAY_SCALE;
    const maxWidth = cw * 0.6;
    const maxHeight = ch * 0.6;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const el = document.createElement('img');
        el.crossOrigin = 'anonymous';
        el.onload = () => {
          const iw = el.naturalWidth || 1;
          const ih = el.naturalHeight || 1;
          el.width = iw;
          el.height = ih;
          const aspectRatio = iw / ih;

          // Scale down to fit within max 60% of canvas (keeps full image visible)
          let displayWidth = iw;
          let displayHeight = ih;
          if (displayWidth > maxWidth) {
            displayWidth = maxWidth;
            displayHeight = displayWidth / aspectRatio;
          }
          if (displayHeight > maxHeight) {
            displayHeight = maxHeight;
            displayWidth = displayHeight * aspectRatio;
          }
          const scale = displayWidth / iw;
          const left = (cw - displayWidth) / 2;
          const top = (ch - displayHeight) / 2;

          const scaledDown = displayWidth < iw || displayHeight < ih;
          const img = new FabricImage(el, {
            width: iw,
            height: ih,
            scaleX: scale,
            scaleY: scale,
            left,
            top,
            originX: 'left',
            originY: 'top',
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
            cornerStyle: 'circle',
            cornerColor: brand?.colors.primary || '#7C3AED',
            borderColor: brand?.colors.primary || '#7C3AED',
            transparentCorners: false,
          });

          (img as FabricObject & { id?: string; layerName?: string; maskShape?: string }).id = `logo-${Date.now()}`;
          (img as FabricObject & { layerName?: string; maskShape?: string }).layerName = 'Image';
          (img as FabricObject & { maskShape?: string }).maskShape = 'none';
          fabricCanvasRef.current?.add(img);
          img.setCoords();
          fabricCanvasRef.current?.setActiveObject(img);
          setLayersVersion((v) => v + 1);
          setSelectedObject(img);
          fabricCanvasRef.current?.requestRenderAll();
          if (scaledDown) {
            toast.success('Logo scaled to fit canvas. Use corners to resize.');
          } else {
            toast.success('Logo added! Drag to move, use corners to resize.');
          }
        };
        el.onerror = () => {
          toast.error('Failed to load logo image');
        };
        el.src = dataUrl;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [brand?.colors.primary]);

  // Add brand logo from context: auto-scale to fit within 60% of canvas, full image visible
  const handleAddBrandLogo = useCallback(() => {
    if (!fabricCanvasRef.current || !brand?.logoUrl) return;

    const cw = CANVAS_WIDTH * DISPLAY_SCALE;
    const ch = CANVAS_HEIGHT * DISPLAY_SCALE;
    const maxWidth = cw * 0.6;
    const maxHeight = ch * 0.6;

    const el = document.createElement('img');
    el.crossOrigin = 'anonymous';
    el.onload = () => {
      const iw = el.naturalWidth || 1;
      const ih = el.naturalHeight || 1;
      el.width = iw;
      el.height = ih;
      const aspectRatio = iw / ih;

      let displayWidth = iw;
      let displayHeight = ih;
      if (displayWidth > maxWidth) {
        displayWidth = maxWidth;
        displayHeight = displayWidth / aspectRatio;
      }
      if (displayHeight > maxHeight) {
        displayHeight = maxHeight;
        displayWidth = displayHeight * aspectRatio;
      }
      const scale = displayWidth / iw;
      const left = (cw - displayWidth) / 2;
      const top = (ch - displayHeight) / 2;

      const img = new FabricImage(el, {
        width: iw,
        height: ih,
        scaleX: scale,
        scaleY: scale,
        left,
        top,
        originX: 'left',
        originY: 'top',
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        cornerStyle: 'circle',
        cornerColor: brand.colors.primary,
        borderColor: brand.colors.primary,
        transparentCorners: false,
      });

      (img as FabricObject & { id?: string; layerName?: string; maskShape?: string }).id = `brand-logo-${Date.now()}`;
      (img as FabricObject & { layerName?: string; maskShape?: string }).layerName = 'Brand Logo';
      (img as FabricObject & { maskShape?: string }).maskShape = 'none';
      fabricCanvasRef.current.add(img);
      img.setCoords();
      fabricCanvasRef.current.setActiveObject(img);
      setLayersVersion((v) => v + 1);
      setSelectedObject(img);
      fabricCanvasRef.current.requestRenderAll();
      toast.success('Brand logo added! Drag to move, use corners to resize.');
    };
    el.onerror = () => toast.error('Failed to load brand logo');
    el.src = brand.logoUrl;
  }, [brand?.logoUrl, brand?.colors.primary]);

  // Delete selected object
  const handleDeleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;

    fabricCanvasRef.current.remove(selectedObject);
    fabricCanvasRef.current.renderAll();
    setSelectedObject(null);
    toast.success('Element deleted');
  }, [selectedObject]);

  // Update text properties
  const updateTextProperty = useCallback((property: string, value: string | number | boolean) => {
    if (!fabricCanvasRef.current || !selectedObject || !(selectedObject instanceof IText)) return;

    selectedObject.set(property as keyof IText, value);
    fabricCanvasRef.current.renderAll();
  }, [selectedObject]);

  // Image/Logo: mask shape (clipPath). Fabric positions clipPath from the OBJECT CENTER. No fill/stroke so no black background.
  const handleMaskShapeChange = useCallback((value: 'none' | 'circle' | 'rounded-10' | 'rounded-20' | 'rounded-30') => {
    if (!fabricCanvasRef.current || !selectedObject || !(selectedObject instanceof FabricImage)) return;
    const obj = selectedObject;
    const w = (obj.get('width') ?? obj.width) ?? 1;
    const h = (obj.get('height') ?? obj.height) ?? 1;

    // Store in element state so dropdown shows current selection
    (obj as FabricObject & { maskShape?: string }).maskShape = value;

    if (value === 'none') {
      obj.set('clipPath', undefined as unknown as FabricCircle);
    } else if (value === 'circle') {
      // Inscribed circle so mask matches logo bounds – no oversized area, no black background
      const r = Math.min(w, h) / 2;
      const circle = new FabricCircle({
        radius: r,
        originX: 'center',
        originY: 'center',
        left: 0,
        top: 0,
        fill: 'transparent',
        strokeWidth: 0,
      });
      obj.set('clipPath', circle);
    } else {
      // Rounded rect: full image bounds with rounded corners. SVG clipPath uses black fill for mask.
      const rx = value === 'rounded-10' ? 10 : value === 'rounded-20' ? 20 : 30;
      const rect = new Rect({
        width: w,
        height: h,
        left: -w / 2,
        top: -h / 2,
        originX: 'left',
        originY: 'top',
        rx,
        ry: rx,
        fill: 'black',
        strokeWidth: 0,
      });
      obj.set('clipPath', rect);
    }

    fabricCanvasRef.current.requestRenderAll();
    setLayersVersion((v) => v + 1); // Force React re-render so dropdown shows new value
  }, [selectedObject]);

  // Image: flip and replace
  const handleImageFlip = useCallback((direction: 'horizontal' | 'vertical') => {
    if (!fabricCanvasRef.current || !selectedObject || !(selectedObject instanceof FabricImage)) return;
    const flipX = selectedObject.get('flipX') ?? false;
    const flipY = selectedObject.get('flipY') ?? false;
    if (direction === 'horizontal') selectedObject.set('flipX', !flipX);
    else selectedObject.set('flipY', !flipY);
    fabricCanvasRef.current.renderAll();
    toast.success(`Flipped ${direction}`);
  }, [selectedObject]);

  const handleReplaceImage = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject || !(selectedObject instanceof FabricImage)) return;
    const canvas = fabricCanvasRef.current;
    const left = selectedObject.left ?? 0;
    const top = selectedObject.top ?? 0;
    const scaleX = selectedObject.scaleX ?? 1;
    const scaleY = selectedObject.scaleY ?? 1;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      try {
        const newImg = await FabricImage.fromURL(dataUrl);
        newImg.set({ left, top, scaleX, scaleY });
        (newImg as FabricObject & { id?: string; layerName?: string }).id = (selectedObject as FabricObject & { id?: string }).id;
        (newImg as FabricObject & { layerName?: string }).layerName = (selectedObject as FabricObject & { layerName?: string }).layerName ?? 'Image';
        canvas.remove(selectedObject);
        canvas.add(newImg);
        canvas.setActiveObject(newImg);
        setSelectedObject(newImg);
        canvas.renderAll();
        setLayersVersion((v) => v + 1);
        toast.success('Image replaced');
      } catch (err) {
        toast.error('Failed to replace image');
      }
    };
    input.click();
  }, [selectedObject]);

  // Effects: shadow (Fabric Shadow)
  const setObjectShadow = useCallback((offsetX: number, offsetY: number, blur: number, color: string) => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    selectedObject.set('shadow', new FabricShadow({ color, blur, offsetX, offsetY }));
    fabricCanvasRef.current.renderAll();
  }, [selectedObject]);

  // Apply brand color to selected text
  const applyColorToSelected = useCallback((color: string) => {
    if (!fabricCanvasRef.current || !selectedObject) return;

    if (selectedObject instanceof IText) {
      selectedObject.set('fill', color);
      fabricCanvasRef.current.renderAll();
    }
  }, [selectedObject]);

  // Layer Management: Bring to Front
  const handleBringToFront = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    fabricCanvasRef.current.bringObjectToFront(selectedObject);
    fabricCanvasRef.current.renderAll();
    toast.success('Element brought to front');
  }, [selectedObject]);

  // Layer Management: Send to Back
  const handleSendToBack = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    fabricCanvasRef.current.sendObjectToBack(selectedObject);
    fabricCanvasRef.current.renderAll();
    toast.success('Element sent to back');
  }, [selectedObject]);

  // Layer panel: select object
  const handleLayerSelect = useCallback((obj: FabricObject) => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.setActiveObject(obj);
    fabricCanvasRef.current.renderAll();
    setSelectedObject(obj);
  }, []);

  // Layer panel: delete
  const handleLayerDelete = useCallback((obj: FabricObject) => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.remove(obj);
    fabricCanvasRef.current.renderAll();
    if (selectedObject === obj) setSelectedObject(null);
    setLayersVersion((v) => v + 1);
    toast.success('Layer deleted');
  }, [selectedObject]);

  // Layer panel: duplicate
  const handleLayerDuplicate = useCallback((obj: FabricObject) => {
    if (!fabricCanvasRef.current) return;
    obj.clone().then((cloned: FabricObject) => {
      cloned.set({ left: (obj.left ?? 0) + 20, top: (obj.top ?? 0) + 20 });
      (cloned as FabricObject & { id?: string }).id = `${(obj as FabricObject & { id?: string }).id ?? 'obj'}-copy-${Date.now()}`;
      fabricCanvasRef.current?.add(cloned);
      fabricCanvasRef.current?.setActiveObject(cloned);
      fabricCanvasRef.current?.renderAll();
      setSelectedObject(cloned);
      setLayersVersion((v) => v + 1);
      toast.success('Layer duplicated');
    });
  }, []);

  // Layer panel: visibility & lock
  const handleVisibilityToggle = useCallback((obj: FabricObject, visible: boolean) => {
    obj.set('visible', visible);
    fabricCanvasRef.current?.renderAll();
    setLayersVersion((v) => v + 1);
  }, []);
  const handleLockToggle = useCallback((obj: FabricObject, locked: boolean) => {
    obj.set('selectable', !locked);
    obj.set('evented', !locked);
    fabricCanvasRef.current?.renderAll();
    setLayersVersion((v) => v + 1);
  }, []);
  const handleLayerRename = useCallback((_obj: FabricObject, _name: string) => {
    setLayersVersion((v) => v + 1);
  }, []);

  // Layer panel: reorder (background is canvas.backgroundImage, not in getObjects())
  const handleLayerReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (!fabricCanvasRef.current) return;
    const all = fabricCanvasRef.current.getObjects();
    const obj = all[fromIndex];
    if (!obj) return;
    fabricCanvasRef.current.moveObjectTo(obj, Math.min(toIndex, all.length - 1));
    fabricCanvasRef.current.requestRenderAll();
    setLayersVersion((v) => v + 1);
  }, []);

  // Transform controls (value in design pixels for left/top/width/height)
  const handleTransformChange = useCallback((
    key: 'left' | 'top' | 'width' | 'height' | 'angle',
    value: number
  ) => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    const scaled = value * DISPLAY_SCALE;
    if (key === 'angle') {
      selectedObject.set('angle', value);
    } else if (key === 'left' || key === 'top') {
      selectedObject.set(key, scaled);
    } else if (key === 'width' || key === 'height') {
      const scaleX = selectedObject.scaleX ?? 1;
      const scaleY = selectedObject.scaleY ?? 1;
      const w = selectedObject.getScaledWidth();
      const h = selectedObject.getScaledHeight();
      if (key === 'width' && w > 0) {
        const newScaleX = scaled / (w / scaleX);
        selectedObject.set('scaleX', newScaleX);
        if (lockAspectRatio) selectedObject.set('scaleY', newScaleX);
      } else if (key === 'height' && h > 0) {
        const newScaleY = scaled / (h / scaleY);
        selectedObject.set('scaleY', newScaleY);
        if (lockAspectRatio) selectedObject.set('scaleX', newScaleY);
      }
    }
    fabricCanvasRef.current.renderAll();
  }, [selectedObject, lockAspectRatio]);

  // Alignment: move objects so bounding rect is at target (works for any origin)
  const handleAlign = useCallback((
    mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distributeH' | 'distributeV'
  ) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    const allObjects = canvas.getObjects().filter((o) => !o.isBackground);
    const objects = active ? [active] : allObjects;
    if (objects.length === 0) return;
    const cW = CANVAS_WIDTH * DISPLAY_SCALE;
    const cH = CANVAS_HEIGHT * DISPLAY_SCALE;
    if (objects.length === 1) {
      const obj = objects[0];
      const bbox = obj.getBoundingRect(true);
      const left = obj.left ?? 0;
      const top = obj.top ?? 0;
      if (mode === 'left') obj.set('left', left + (0 - bbox.left));
      else if (mode === 'center') obj.set('left', left + (cW / 2 - (bbox.left + bbox.width / 2)));
      else if (mode === 'right') obj.set('left', left + (cW - bbox.width - bbox.left));
      else if (mode === 'top') obj.set('top', top + (0 - bbox.top));
      else if (mode === 'middle') obj.set('top', top + (cH / 2 - (bbox.top + bbox.height / 2)));
      else if (mode === 'bottom') obj.set('top', top + (cH - bbox.height - bbox.top));
    } else {
      if (mode === 'distributeH') {
        const sorted = [...objects].sort((a, b) => a.getBoundingRect(true).left - b.getBoundingRect(true).left);
        const totalW = sorted.reduce((acc, o) => acc + o.getBoundingRect(true).width, 0);
        const gap = sorted.length > 1 ? (cW - totalW) / (sorted.length - 1) : 0;
        let x = 0;
        sorted.forEach((o) => {
          const bbox = o.getBoundingRect(true);
          const delta = x - bbox.left;
          o.set('left', (o.left ?? 0) + delta);
          x += bbox.width + gap;
        });
      } else if (mode === 'distributeV') {
        const sorted = [...objects].sort((a, b) => a.getBoundingRect(true).top - b.getBoundingRect(true).top);
        const totalH = sorted.reduce((acc, o) => acc + o.getBoundingRect(true).height, 0);
        const gap = sorted.length > 1 ? (cH - totalH) / (sorted.length - 1) : 0;
        let y = 0;
        sorted.forEach((o) => {
          const bbox = o.getBoundingRect(true);
          const delta = y - bbox.top;
          o.set('top', (o.top ?? 0) + delta);
          y += bbox.height + gap;
        });
      }
    }
    canvas.requestRenderAll();
    toast.success('Aligned');
  }, []);

  // Update element opacity
  const handleOpacityChange = useCallback((value: number[]) => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    const opacity = value[0] / 100;
    selectedObject.set('opacity', opacity);
    setElementOpacity(value[0]);
    fabricCanvasRef.current.renderAll();
  }, [selectedObject]);

  // Add shape: Rectangle
  const handleAddRectangle = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const rect = new Rect({
      left: (CANVAS_WIDTH * DISPLAY_SCALE) / 2 - 75,
      top: (CANVAS_HEIGHT * DISPLAY_SCALE) / 2 - 50,
      width: 150 * DISPLAY_SCALE,
      height: 100 * DISPLAY_SCALE,
      fill: brand?.colors.primary || '#7C3AED',
      opacity: 0.8,
      rx: 8 * DISPLAY_SCALE,
      ry: 8 * DISPLAY_SCALE,
      cornerStyle: 'circle',
      cornerColor: brand?.colors.primary || '#7C3AED',
      borderColor: brand?.colors.primary || '#7C3AED',
      transparentCorners: false,
    });

    (rect as FabricObject & { id?: string; layerName?: string }).id = `rect-${Date.now()}`;
    (rect as FabricObject & { layerName?: string }).layerName = 'Rectangle';
    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.setActiveObject(rect);
    setLayersVersion((v) => v + 1);
    setSelectedObject(rect);
    fabricCanvasRef.current.requestRenderAll();
    toast.success('Rectangle added!');
  }, [brand?.colors.primary]);

  // Add shape: Circle
  const handleAddCircle = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const circle = new FabricCircle({
      left: (CANVAS_WIDTH * DISPLAY_SCALE) / 2 - 50,
      top: (CANVAS_HEIGHT * DISPLAY_SCALE) / 2 - 50,
      radius: 50 * DISPLAY_SCALE,
      fill: brand?.colors.secondary || '#3B82F6',
      opacity: 0.8,
      cornerStyle: 'circle',
      cornerColor: brand?.colors.secondary || '#3B82F6',
      borderColor: brand?.colors.secondary || '#3B82F6',
      transparentCorners: false,
    });

    (circle as FabricObject & { id?: string; layerName?: string }).id = `circle-${Date.now()}`;
    (circle as FabricObject & { layerName?: string }).layerName = 'Circle';
    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);
    setLayersVersion((v) => v + 1);
    setSelectedObject(circle);
    fabricCanvasRef.current.requestRenderAll();
    toast.success('Circle added!');
  }, [brand?.colors.secondary]);

  // Apply background filter: Brightness
  const handleBrightnessChange = useCallback((value: number[]) => {
    if (!fabricCanvasRef.current || !backgroundImageRef.current) return;
    
    const brightness = value[0] / 100;
    setBackgroundBrightness(value[0]);
    
    // Remove existing brightness filter
    const existingFilters = backgroundImageRef.current.filters || [];
    const filteredFilters = existingFilters.filter(f => !(f instanceof filters.Brightness));
    
    if (brightness !== 0) {
      filteredFilters.push(new filters.Brightness({ brightness }));
    }
    
    backgroundImageRef.current.filters = filteredFilters;
    backgroundImageRef.current.applyFilters();
    fabricCanvasRef.current.renderAll();
  }, []);

  // Apply background filter: Contrast
  const handleContrastChange = useCallback((value: number[]) => {
    if (!fabricCanvasRef.current || !backgroundImageRef.current) return;
    
    const contrast = value[0] / 100;
    setBackgroundContrast(value[0]);
    
    // Remove existing contrast filter
    const existingFilters = backgroundImageRef.current.filters || [];
    const filteredFilters = existingFilters.filter(f => !(f instanceof filters.Contrast));
    
    if (contrast !== 0) {
      filteredFilters.push(new filters.Contrast({ contrast }));
    }
    
    backgroundImageRef.current.filters = filteredFilters;
    backgroundImageRef.current.applyFilters();
    fabricCanvasRef.current.renderAll();
  }, []);

  // Apply background filter: Grayscale toggle
  const handleGrayscaleToggle = useCallback(() => {
    if (!fabricCanvasRef.current || !backgroundImageRef.current) return;
    
    const newGrayscale = !backgroundGrayscale;
    setBackgroundGrayscale(newGrayscale);
    
    // Remove existing grayscale filter
    const existingFilters = backgroundImageRef.current.filters || [];
    const filteredFilters = existingFilters.filter(f => !(f instanceof filters.Grayscale));
    
    if (newGrayscale) {
      filteredFilters.push(new filters.Grayscale());
    }
    
    backgroundImageRef.current.filters = filteredFilters;
    backgroundImageRef.current.applyFilters();
    fabricCanvasRef.current.renderAll();
    toast.success(newGrayscale ? 'Grayscale applied' : 'Grayscale removed');
  }, [backgroundGrayscale]);

  // Update shape fill color
  const applyFillToShape = useCallback((color: string) => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    
    if (selectedObject instanceof Rect || selectedObject instanceof FabricCircle) {
      selectedObject.set('fill', color);
      fabricCanvasRef.current.renderAll();
    }
  }, [selectedObject]);

  // Export canvas to Supabase storage
  const handleExport = async () => {
    if (!fabricCanvasRef.current || !brand) return;

    setIsExporting(true);

    try {
      // Generate high-resolution export (2x multiplier)
      const canvas = fabricCanvasRef.current;
      const multiplier = 2 / DISPLAY_SCALE; // Results in 2x the original size
      
      // Get data URL at high resolution
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: multiplier,
      });

      // Save base64 to context for fallback download
      setFinalVisualBase64(dataUrl);

      // Convert data URL to Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${brand.name.replace(/\s+/g, '-').toLowerCase()}-${product?.type.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.png`;
      const filePath = `visuals/${filename}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('final-visuals')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        // If bucket doesn't exist, use local storage fallback
        console.warn('Supabase storage upload failed, using local fallback:', error);
        toast.success('Visual exported! Proceeding to download...');
        setFinalVisualUrl(null); // Will use base64 fallback
        navigate('/step5');
        return;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('final-visuals')
        .getPublicUrl(filePath);

      setFinalVisualUrl(publicUrlData.publicUrl);
      toast.success('Visual exported successfully!');
      navigate('/step5');

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!brand || !product || !generatedImage) {
    return null;
  }

  return (
    <>
    <motion.div 
      className="min-h-screen bg-background noise-overlay py-8 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <StepHeader 
          currentStep={4}
          title="Customize Your Visual"
          description="Add logos, text overlays, and fine-tune your design"
        />

        {/* Brand Context Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="p-3 glass bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Brand Colors:</span>
                <div className="flex items-center gap-1">
                  <div 
                    className="w-6 h-6 rounded-md border border-border/50 cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: brand.colors.primary }}
                    title={`Primary: ${brand.colors.primary}`}
                    onClick={() => applyColorToSelected(brand.colors.primary)}
                  />
                  <div 
                    className="w-6 h-6 rounded-md border border-border/50 cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: brand.colors.secondary }}
                    title={`Secondary: ${brand.colors.secondary}`}
                    onClick={() => applyColorToSelected(brand.colors.secondary)}
                  />
                  <div 
                    className="w-6 h-6 rounded-md border border-border/50 cursor-pointer hover:scale-110 transition-transform bg-white"
                    title="White"
                    onClick={() => applyColorToSelected('#ffffff')}
                  />
                  <div 
                    className="w-6 h-6 rounded-md border border-border/50 cursor-pointer hover:scale-110 transition-transform bg-black"
                    title="Black"
                    onClick={() => applyColorToSelected('#000000')}
                  />
                </div>
              </div>
              <div className="w-px h-4 bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">Font:</span>
                <Badge variant="outline" style={{ fontFamily: brandFontFamily }}>
                  {brand.font}
                </Badge>
              </div>
              <div className="w-px h-4 bg-border hidden sm:block" />
              <Badge variant="secondary">{product.type}</Badge>
            </div>
          </Card>
        </motion.div>

        <motion.div 
          className="flex flex-col lg:flex-row w-full gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ minHeight: 0 }}
        >
          {/* Left sidebar: fixed 350px, always visible, no toggle */}
          <aside
            className="flex-shrink-0 w-full lg:w-[350px] flex flex-col gap-4 overflow-y-auto overflow-x-hidden pr-2 z-10 bg-background"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
            aria-label="Layers and add elements"
          >
            <LayerPanel
              objects={canvasObjects}
              selectedObject={selectedObject}
              displayScale={DISPLAY_SCALE}
              onSelect={handleLayerSelect}
              onDelete={handleLayerDelete}
              onDuplicate={handleLayerDuplicate}
              onVisibilityToggle={handleVisibilityToggle}
              onLockToggle={handleLockToggle}
              onRename={handleLayerRename}
              onReorder={handleLayerReorder}
            />
            {/* Add Elements */}
            <Card className="p-4 glass">
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2 tracking-tight">
                <Plus className="w-4 h-4 text-primary" />
                Add Elements
              </h3>
              
              {!canvasReady ? (
                <p className="text-sm text-muted-foreground">Loading canvas…</p>
              ) : (
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={handleAddText}
                >
                  <Type className="w-4 h-4 mr-2" />
                  Add Text
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={handleAddLogo}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </Button>

                {brand.logoUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={handleAddBrandLogo}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Brand Logo
                  </Button>
                )}

                {/* Shapes */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={handleAddRectangle}
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Rect
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={handleAddCircle}
                  >
                    <Circle className="w-4 h-4 mr-1" />
                    Circle
                  </Button>
                </div>
              </div>
              )}
            </Card>

            {/* Selected Element Controls */}
            {selectedObject && (
              <Card className="p-4 glass border-primary/30 min-w-0">
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2 tracking-tight">
                  <Move className="w-4 h-4 text-primary" />
                  Edit Element
                </h3>
                
                <div className="space-y-3">
                  <TransformControls
                    selectedObject={selectedObject}
                    displayScale={DISPLAY_SCALE}
                    onTransformChange={handleTransformChange}
                    lockAspectRatio={lockAspectRatio}
                    onLockAspectRatioChange={setLockAspectRatio}
                  />
                  {/* Layer Order */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                      <Layers className="w-3 h-3" />
                      Layer Order
                    </Label>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={handleBringToFront}
                      >
                        <ArrowUp className="w-3 h-3 mr-1" />
                        Front
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={handleSendToBack}
                      >
                        <ArrowDown className="w-3 h-3 mr-1" />
                        Back
                      </Button>
                    </div>
                  </div>

                  {/* Opacity Slider */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Opacity: {elementOpacity}%
                    </Label>
                    <Slider
                      value={[elementOpacity]}
                      onValueChange={handleOpacityChange}
                      min={0}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  {selectedObject instanceof IText && (
                    <>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Text Content</Label>
                        <Input 
                          value={(selectedObject as IText).text || ''}
                          onChange={(e) => updateTextProperty('text', e.target.value)}
                          className="mt-1 bg-secondary/50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Size</Label>
                          <Select 
                            value={String(Math.round(((selectedObject as IText).fontSize || 24) / DISPLAY_SCALE))}
                            onValueChange={(value) => updateTextProperty('fontSize', Number(value) * DISPLAY_SCALE)}
                          >
                            <SelectTrigger className="mt-1 bg-secondary/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="24">Small</SelectItem>
                              <SelectItem value="36">Medium</SelectItem>
                              <SelectItem value="48">Large</SelectItem>
                              <SelectItem value="72">XL</SelectItem>
                              <SelectItem value="96">Huge</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Weight</Label>
                          <Select 
                            value={(selectedObject as IText).fontWeight as string || 'normal'}
                            onValueChange={(value) => updateTextProperty('fontWeight', value)}
                          >
                            <SelectTrigger className="mt-1 bg-secondary/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="300">Light</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="600">Semibold</SelectItem>
                              <SelectItem value="bold">Bold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Text Color</Label>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <div 
                            className="w-7 h-7 rounded-lg cursor-pointer border-2 border-transparent hover:border-primary/50 transition-colors"
                            style={{ backgroundColor: brand.colors.primary }}
                            onClick={() => applyColorToSelected(brand.colors.primary)}
                          />
                          <div 
                            className="w-7 h-7 rounded-lg cursor-pointer border-2 border-transparent hover:border-primary/50 transition-colors"
                            style={{ backgroundColor: brand.colors.secondary }}
                            onClick={() => applyColorToSelected(brand.colors.secondary)}
                          />
                          <div 
                            className="w-7 h-7 bg-white rounded-lg cursor-pointer border-2 border-transparent hover:border-primary/50 transition-colors"
                            onClick={() => applyColorToSelected('#ffffff')}
                          />
                          <div 
                            className="w-7 h-7 bg-black rounded-lg cursor-pointer border-2 border-transparent hover:border-primary/50 transition-colors"
                            onClick={() => applyColorToSelected('#000000')}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <Label className="text-xs text-muted-foreground">Font size (8-200)</Label>
                          <Input type="number" min={8} max={200} className="mt-0.5 h-8 bg-secondary/50"
                            value={Math.round(((selectedObject as IText).fontSize ?? 24) / DISPLAY_SCALE)}
                            onChange={(e) => updateTextProperty('fontSize', Number(e.target.value) * DISPLAY_SCALE)} />
                        </div>
                        <div className="col-span-2 flex gap-1">
                          <Button variant={(selectedObject as IText).fontWeight === 'bold' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => updateTextProperty('fontWeight', (selectedObject as IText).fontWeight === 'bold' ? 'normal' : 'bold')}>Bold</Button>
                          <Button variant={(selectedObject as IText).fontStyle === 'italic' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => updateTextProperty('fontStyle', (selectedObject as IText).fontStyle === 'italic' ? 'normal' : 'italic')}>Italic</Button>
                          <Button variant={(selectedObject as IText).underline ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => updateTextProperty('underline', !(selectedObject as IText).underline)}>Underline</Button>
                        </div>
                        <div className="col-span-2 flex gap-1">
                          {(['left', 'center', 'right', 'justify'] as const).map((a) => (
                            <Button key={a} variant={(selectedObject as IText).textAlign === a ? 'default' : 'outline'} size="sm" onClick={() => updateTextProperty('textAlign', a)}>{a[0].toUpperCase()}</Button>
                          ))}
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Letter spacing</Label>
                          <Input type="number" className="mt-0.5 h-8 bg-secondary/50"
                            value={(selectedObject as IText).charSpacing ?? 0}
                            onChange={(e) => updateTextProperty('charSpacing', Number(e.target.value))} />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Line height</Label>
                          <Input type="number" step={0.1} min={0.5} max={3} className="mt-0.5 h-8 bg-secondary/50"
                            value={(selectedObject as IText).lineHeight ?? 1.16}
                            onChange={(e) => updateTextProperty('lineHeight', Number(e.target.value))} />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedObject instanceof FabricImage && (
                    <div className="space-y-2 min-w-0">
                      <Label className="text-xs font-medium text-muted-foreground">Image</Label>
                      <div className="flex flex-wrap gap-1.5">
                        <Button variant="outline" size="sm" className="shrink-0" onClick={handleReplaceImage} title="Replace image">Replace</Button>
                        <Button variant="outline" size="sm" className="shrink-0" onClick={() => handleImageFlip('horizontal')} title="Flip horizontal">Flip H</Button>
                        <Button variant="outline" size="sm" className="shrink-0" onClick={() => handleImageFlip('vertical')} title="Flip vertical">Flip V</Button>
                      </div>
                      <div className="pt-1">
                        <Label className="text-xs text-muted-foreground">Mask Shape</Label>
                        <Select
                          key={`mask-${(selectedObject as FabricObject & { id?: string; maskShape?: string }).id ?? ''}-${(selectedObject as FabricObject & { maskShape?: string }).maskShape ?? 'none'}`}
                          value={(selectedObject as FabricObject & { maskShape?: string }).maskShape ?? 'none'}
                          onValueChange={(v) => handleMaskShapeChange(v as 'none' | 'circle' | 'rounded-10' | 'rounded-20' | 'rounded-30')}
                        >
                          <SelectTrigger className="mt-0.5 h-8 bg-secondary/50 text-xs">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="circle">Circle</SelectItem>
                            <SelectItem value="rounded-10">Rounded 10px</SelectItem>
                            <SelectItem value="rounded-20">Rounded 20px</SelectItem>
                            <SelectItem value="rounded-30">Rounded 30px</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Effects</Label>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div><Label className="text-muted-foreground">Shadow X</Label><Input type="number" className="h-7 bg-secondary/50" defaultValue={(selectedObject?.shadow as { offsetX?: number })?.offsetX ?? 0} onBlur={(e) => { const s = selectedObject?.shadow as { offsetX?: number; offsetY?: number; blur?: number; color?: string }; setObjectShadow(Number(e.target.value) || 0, s?.offsetY ?? 0, s?.blur ?? 10, s?.color ?? 'rgba(0,0,0,0.5)'); }} /></div>
                      <div><Label className="text-muted-foreground">Shadow Y</Label><Input type="number" className="h-7 bg-secondary/50" defaultValue={(selectedObject?.shadow as { offsetY?: number })?.offsetY ?? 0} onBlur={(e) => { const s = selectedObject?.shadow as { offsetX?: number; offsetY?: number; blur?: number; color?: string }; setObjectShadow(s?.offsetX ?? 0, Number(e.target.value) || 0, s?.blur ?? 10, s?.color ?? 'rgba(0,0,0,0.5)'); }} /></div>
                      <div><Label className="text-muted-foreground">Blur</Label><Input type="number" className="h-7 bg-secondary/50" defaultValue={(selectedObject?.shadow as { blur?: number })?.blur ?? 10} onBlur={(e) => { const s = selectedObject?.shadow as { offsetX?: number; offsetY?: number; blur?: number; color?: string }; setObjectShadow(s?.offsetX ?? 0, s?.offsetY ?? 0, Number(e.target.value) || 0, s?.color ?? 'rgba(0,0,0,0.5)'); }} /></div>
                      <div><Label className="text-muted-foreground">Border W</Label><Input type="number" min={0} max={20} className="h-7 bg-secondary/50" value={selectedObject?.strokeWidth ?? 0} onChange={(e) => { selectedObject?.set('strokeWidth', Number(e.target.value)); fabricCanvasRef.current?.renderAll(); }} /></div>
                    </div>
                  </div>

                  {/* Shape Color Controls */}
                  {(selectedObject instanceof Rect || selectedObject instanceof FabricCircle) && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Shape Fill</Label>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <div 
                          className="w-7 h-7 rounded-lg cursor-pointer border-2 border-transparent hover:border-primary/50 transition-colors"
                          style={{ backgroundColor: brand.colors.primary }}
                          onClick={() => applyFillToShape(brand.colors.primary)}
                        />
                        <div 
                          className="w-7 h-7 rounded-lg cursor-pointer border-2 border-transparent hover:border-primary/50 transition-colors"
                          style={{ backgroundColor: brand.colors.secondary }}
                          onClick={() => applyFillToShape(brand.colors.secondary)}
                        />
                        <div 
                          className="w-7 h-7 bg-white rounded-lg cursor-pointer border-2 border-transparent hover:border-primary/50 transition-colors border-gray-200"
                          onClick={() => applyFillToShape('#ffffff')}
                        />
                        <div 
                          className="w-7 h-7 bg-black rounded-lg cursor-pointer border-2 border-transparent hover:border-primary/50 transition-colors"
                          onClick={() => applyFillToShape('#000000')}
                        />
                        <div 
                          className="w-7 h-7 bg-transparent rounded-lg cursor-pointer border-2 border-dashed border-gray-400 hover:border-primary/50 transition-colors flex items-center justify-center text-[8px] text-muted-foreground"
                          onClick={() => applyFillToShape('transparent')}
                        >
                          ✕
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Element
                  </Button>
                </div>
              </Card>
            )}

            {/* Background Filters */}
            <Card className="p-4 glass">
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2 tracking-tight">
                <Filter className="w-4 h-4 text-accent" />
                Visual Mood
              </h3>
              
              <div className="space-y-3">
                {/* Brightness */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Sun className="w-3 h-3" />
                    Brightness: {backgroundBrightness > 0 ? '+' : ''}{backgroundBrightness}%
                  </Label>
                  <Slider
                    value={[backgroundBrightness]}
                    onValueChange={handleBrightnessChange}
                    min={-50}
                    max={50}
                    step={5}
                    className="mt-2"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Contrast className="w-3 h-3" />
                    Contrast: {backgroundContrast > 0 ? '+' : ''}{backgroundContrast}%
                  </Label>
                  <Slider
                    value={[backgroundContrast]}
                    onValueChange={handleContrastChange}
                    min={-50}
                    max={50}
                    step={5}
                    className="mt-2"
                  />
                </div>

                {/* Grayscale Toggle */}
                <Button 
                  variant={backgroundGrayscale ? "default" : "outline"}
                  size="sm" 
                  className="w-full"
                  onClick={handleGrayscaleToggle}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {backgroundGrayscale ? 'Remove Grayscale' : 'Apply Grayscale'}
                </Button>
              </div>
            </Card>

            {/* Instructions */}
            <Card className="p-4 glass">
              <h3 className="text-sm font-semibold text-foreground mb-2 tracking-tight">
                Quick Tips
              </h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Click to select, drag to move</li>
                <li>• Corners to resize</li>
                <li>• Double-click text to edit</li>
                <li>• Delete key to remove</li>
              </ul>
            </Card>
          </aside>

          {/* Main canvas area: flex: 1, margin from sidebar via gap; toolbar + canvas inside */}
          <main
            className="flex-1 min-w-0 flex flex-col items-stretch py-6 pl-4 pr-4 lg:pl-6 overflow-x-auto"
            style={{ minWidth: 0 }}
          >
            {/* Canvas container: toolbar at top (fully visible) then canvas card */}
            <div className="flex flex-col items-center w-full min-w-0">
              {/* Alignment toolbar: inside canvas area, never cropped */}
              <div className="w-full mb-3 flex justify-center overflow-visible shrink-0" style={{ minWidth: 320 }}>
                <AlignmentToolbar
                  canvasWidth={CANVAS_WIDTH}
                  canvasHeight={CANVAS_HEIGHT}
                  displayScale={DISPLAY_SCALE}
                  selectedObjects={selectedObject ? [selectedObject] : canvasObjects}
                  onAlign={handleAlign}
                />
              </div>
              <Card className="p-4 glass overflow-hidden relative w-full" style={{ maxWidth: CANVAS_WIDTH * DISPLAY_SCALE + 32 }}>
                <div
                  className="flex flex-col items-center justify-center relative"
                  style={{ width: '100%', paddingTop: 8, paddingBottom: 8 }}
                >
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-xl">
                      <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading your visual...</p>
                      </div>
                    </div>
                  )}
                  {/* Canvas wrapper: fixed size, margin 0 auto, centered */}
                  <div
                    className="rounded-xl overflow-hidden border-2"
                    style={{
                      width: CANVAS_WIDTH * DISPLAY_SCALE,
                      height: CANVAS_HEIGHT * DISPLAY_SCALE,
                      borderColor: brand.colors.primary,
                      margin: '0 auto',
                      position: 'relative',
                    }}
                  >
                    <canvas
                      width={CANVAS_WIDTH * DISPLAY_SCALE}
                      height={CANVAS_HEIGHT * DISPLAY_SCALE}
                      style={{ display: 'block', position: 'relative' }}
                      ref={(node) => {
                        (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = node;
                        setCanvasNode(node);
                      }}
                    />
                  </div>

                {/* Canvas Info */}
                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground w-full">
                  <span>Canvas: {CANVAS_WIDTH} × {CANVAS_HEIGHT}px</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedObject && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="font-medium"
                        onClick={() => {
                          if (fabricCanvasRef.current) {
                            fabricCanvasRef.current.discardActiveObject();
                            fabricCanvasRef.current.requestRenderAll();
                            setSelectedObject(null);
                            toast.info('Selection cleared');
                          }
                        }}
                      >
                        Clear selection
                      </Button>
                    )}
                    {canvasObjects.length === 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="font-medium text-foreground"
                        onClick={() =>
                          toast.info('No elements to select. Add text, shapes, or upload a logo first.')
                        }
                      >
                        Select an element
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="font-medium text-foreground"
                          >
                            Select an element
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[220px]">
                          <DropdownMenuLabel>Select element</DropdownMenuLabel>
                          {canvasObjects.map((obj, index) => (
                            <DropdownMenuItem
                              key={obj.id ?? `obj-${index}`}
                              onClick={() => handleSelectElement(obj)}
                              className="flex items-center gap-2"
                            >
                              {obj instanceof IText && <Type className="h-4 w-4 shrink-0" />}
                              {obj instanceof FabricImage && <ImageIcon className="h-4 w-4 shrink-0" />}
                              {obj instanceof Rect && <Square className="h-4 w-4 shrink-0" />}
                              {obj instanceof FabricCircle && <Circle className="h-4 w-4 shrink-0" />}
                              {!(obj instanceof IText || obj instanceof FabricImage || obj instanceof Rect || obj instanceof FabricCircle) && (
                                <Square className="h-4 w-4 shrink-0" />
                              )}
                              <span className="truncate">{getElementDisplayName(obj, index)}</span>
                              <span className="ml-auto text-xs text-muted-foreground">{getElementTypeLabel(obj)}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
          </main>
        </motion.div>

        <motion.div 
          className="flex justify-center gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button variant="outline" size="lg" onClick={() => navigate('/step3')}>
            Back to Generate
          </Button>
          <Button 
            variant="hero" 
            size="lg" 
            onClick={handleExport} 
            className="glow-primary"
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Export & Continue
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
    </>
  );
};
