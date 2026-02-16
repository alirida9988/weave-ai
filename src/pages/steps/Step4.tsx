import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Type, Palette, Upload, Plus, Image as ImageIcon, Trash2, Loader2, Move,
  Layers, ArrowUp, ArrowDown, Square, Circle, Sun, Contrast, Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { StepHeader } from "@/components/StepHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useBrand, availableFonts } from "@/contexts/BrandContext";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Canvas, FabricImage, IText, FabricObject, Rect, Circle as FabricCircle, filters } from "fabric";

// Extend FabricObject to include our custom id property
declare module 'fabric' {
  interface FabricObject {
    id?: string;
  }
}

// Canvas dimensions
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const DISPLAY_SCALE = 0.5; // Scale for display

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
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  
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

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: CANVAS_WIDTH * DISPLAY_SCALE,
      height: CANVAS_HEIGHT * DISPLAY_SCALE,
      backgroundColor: '#1a1a2e',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;

    // Handle object selection
    canvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    setCanvasReady(true);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Load background image when canvas is ready
  useEffect(() => {
    if (!canvasReady || !generatedImage || !fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    setIsLoading(true);

    // Load the generated image as background
    FabricImage.fromURL(generatedImage, { crossOrigin: 'anonymous' })
      .then((img) => {
        // Scale image to fit canvas while maintaining aspect ratio
        const scaleX = (CANVAS_WIDTH * DISPLAY_SCALE) / (img.width || 1);
        const scaleY = (CANVAS_HEIGHT * DISPLAY_SCALE) / (img.height || 1);
        const scale = Math.max(scaleX, scaleY);

        img.scale(scale);
        img.set({
          left: 0,
          top: 0,
          originX: 'left',
          originY: 'top',
        });

        // Store reference for filter manipulation
        backgroundImageRef.current = img;

        // Set as background image
        canvas.backgroundImage = img;
        canvas.renderAll();
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load background image:', error);
        toast.error('Failed to load the generated image');
        setIsLoading(false);
      });
  }, [canvasReady, generatedImage]);

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

    text.id = `text-${Date.now()}`;
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    toast.success('Text added! Click to edit.');
  }, [brandFontFamily]);

  // Add logo to canvas
  const handleAddLogo = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    // Create file input for logo upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        
        try {
          const img = await FabricImage.fromURL(dataUrl);
          
          // Scale logo to reasonable size
          const maxSize = 200 * DISPLAY_SCALE;
          const scale = Math.min(maxSize / (img.width || 1), maxSize / (img.height || 1));
          
          img.scale(scale);
          img.set({
            left: 50 * DISPLAY_SCALE,
            top: 50 * DISPLAY_SCALE,
            cornerStyle: 'circle',
            cornerColor: brand?.colors.primary || '#7C3AED',
            borderColor: brand?.colors.primary || '#7C3AED',
            transparentCorners: false,
          });
          
          img.id = `logo-${Date.now()}`;
          fabricCanvasRef.current?.add(img);
          fabricCanvasRef.current?.setActiveObject(img);
          fabricCanvasRef.current?.renderAll();
          toast.success('Logo added! Drag to reposition.');
        } catch (error) {
          console.error('Failed to load logo:', error);
          toast.error('Failed to load logo image');
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [brand?.colors.primary]);

  // Add brand logo from context
  const handleAddBrandLogo = useCallback(async () => {
    if (!fabricCanvasRef.current || !brand?.logoUrl) return;

    try {
      const img = await FabricImage.fromURL(brand.logoUrl, { crossOrigin: 'anonymous' });
      
      const maxSize = 150 * DISPLAY_SCALE;
      const scale = Math.min(maxSize / (img.width || 1), maxSize / (img.height || 1));
      
      img.scale(scale);
      img.set({
        left: (CANVAS_WIDTH * DISPLAY_SCALE) - 100 * DISPLAY_SCALE,
        top: 50 * DISPLAY_SCALE,
        cornerStyle: 'circle',
        cornerColor: brand.colors.primary,
        borderColor: brand.colors.primary,
        transparentCorners: false,
      });
      
      img.id = `brand-logo-${Date.now()}`;
      fabricCanvasRef.current.add(img);
      fabricCanvasRef.current.setActiveObject(img);
      fabricCanvasRef.current.renderAll();
      toast.success('Brand logo added!');
    } catch (error) {
      console.error('Failed to load brand logo:', error);
      toast.error('Failed to load brand logo');
    }
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
  const updateTextProperty = useCallback((property: string, value: string | number) => {
    if (!fabricCanvasRef.current || !selectedObject || !(selectedObject instanceof IText)) return;

    selectedObject.set(property as keyof IText, value);
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

    (rect as any).id = `rect-${Date.now()}`;
    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.setActiveObject(rect);
    fabricCanvasRef.current.renderAll();
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

    (circle as any).id = `circle-${Date.now()}`;
    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);
    fabricCanvasRef.current.renderAll();
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
          className="grid grid-cols-1 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Editor Tools */}
          <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {/* Add Elements */}
            <Card className="p-4 glass">
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2 tracking-tight">
                <Plus className="w-4 h-4 text-primary" />
                Add Elements
              </h3>
              
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
            </Card>

            {/* Selected Element Controls */}
            {selectedObject && (
              <Card className="p-4 glass border-primary/30">
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2 tracking-tight">
                  <Move className="w-4 h-4 text-primary" />
                  Edit Element
                </h3>
                
                <div className="space-y-3">
                  {/* Layer Management */}
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
                    </>
                  )}

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
          </div>

          {/* Main Canvas */}
          <div className="lg:col-span-3">
            <Card className="p-4 glass overflow-hidden">
              <div className="relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-xl">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading your visual...</p>
                    </div>
                  </div>
                )}
                
                <div 
                  className="rounded-xl overflow-hidden border-2 mx-auto"
                  style={{ 
                    borderColor: brand.colors.primary,
                    width: CANVAS_WIDTH * DISPLAY_SCALE,
                    height: CANVAS_HEIGHT * DISPLAY_SCALE,
                  }}
                >
                  <canvas ref={canvasRef} />
                </div>

                {/* Canvas Info */}
                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <span>Canvas: {CANVAS_WIDTH} × {CANVAS_HEIGHT}px</span>
                  <Badge variant="outline">
                    {selectedObject ? 'Element Selected' : 'Select an element'}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
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
  );
};
