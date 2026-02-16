import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Image, Wand2, Download, RefreshCw, Palette, AlertCircle, Sparkles, Check, Loader2, Building2, Maximize2, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { StepHeader } from "@/components/StepHeader";
import { invokeEdgeFunction, EdgeFunctionResponse } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

type GenerationPhase = 
  | 'preparing' 
  | 'analyzing' 
  | 'generating' 
  | 'rendering' 
  | 'finalizing' 
  | 'complete' 
  | 'error';

// Image generation request payload - aggregates ALL user inputs
interface ImageGenerationPayload {
  // From Step 1 (Brand)
  brandSource: 'library' | 'custom';
  brandName: string;
  brandColors: string[];
  productType: string;
  brandLogo: string | null; // base64 or URL if uploaded
  brandFont: string;
  
  // From Step 2 (Creative)
  creativeBrief: string;
  
  // Generation settings
  width: number;
  height: number;
  style: string;
}

// Image generation response type
interface ImageGenerationResponse {
  imageUrl: string;
  prompt: string;
  provider: string;
}

// Get dynamic phase messages based on brand context
const getPhaseMessages = (brandName: string, productType: string): Record<GenerationPhase, { title: string; description: string }> => ({
  preparing: { 
    title: "Preparing Your Vision...", 
    description: `Initializing ${productType} visual creation for ${brandName}` 
  },
  analyzing: { 
    title: `Analyzing ${brandName}'s Brand DNA...`, 
    description: "Incorporating your brand colors, fonts, and style guidelines" 
  },
  generating: { 
    title: `Building Your ${productType} Visual...`, 
    description: `AI is crafting a unique ${productType} aligned with ${brandName}'s identity` 
  },
  rendering: { 
    title: "Rendering High-Quality Image...", 
    description: "Optimizing for stunning visual fidelity at 8K resolution" 
  },
  finalizing: { 
    title: "Almost There...", 
    description: `Adding final touches to your ${brandName} visual` 
  },
  complete: { 
    title: "Visual Created!", 
    description: `Your ${productType} masterpiece for ${brandName} is ready` 
  },
  error: { 
    title: "Generation Failed", 
    description: "Something went wrong - see details below" 
  },
});

// Exponential backoff utility function with safety filter support
async function withExponentialBackoff<T>(
  fn: () => Promise<EdgeFunctionResponse<T>>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    onRetry?: (attempt: number, delay: number) => void;
  } = {}
): Promise<EdgeFunctionResponse<T>> {
  const { maxRetries = 3, initialDelay = 1000, onRetry } = options;
  
  let lastError: Error | null = null;
  let lastSafetyFiltered = false;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await fn();
    
    // Success - return immediately
    if (!result.error) {
      return result;
    }
    
    lastError = result.error;
    lastSafetyFiltered = result.safetyFiltered || false;
    
    // Don't retry safety filtered content - the Edge Function handles softened retries
    if (result.safetyFiltered) {
      return result;
    }
    
    // Check if error is retryable (429 rate limit or 5xx server errors)
    const errorMessage = result.error.message?.toLowerCase() || '';
    const isRetryable = 
      errorMessage.includes('429') || 
      errorMessage.includes('rate limit') ||
      errorMessage.includes('500') ||
      errorMessage.includes('502') ||
      errorMessage.includes('503') ||
      errorMessage.includes('504') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('retryable');
    
    // If not retryable or last attempt, return error
    if (!isRetryable || attempt === maxRetries) {
      return result;
    }
    
    // Calculate delay with exponential backoff (1s, 2s, 4s)
    const delay = initialDelay * Math.pow(2, attempt);
    
    // Notify about retry
    if (onRetry) {
      onRetry(attempt + 1, delay);
    }
    
    console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`);
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  return { data: null, error: lastError, safetyFiltered: lastSafetyFiltered };
}

export const Step3 = () => {
  const navigate = useNavigate();
  const { brand, product, creativeBrief, selectedIdeaPrompt, generatedImage, setGeneratedImage, setCurrentStep } = useBrand();
  
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<GenerationPhase>('preparing');
  const [isGenerating, setIsGenerating] = useState(true);
  const [localImage, setLocalImage] = useState<string | null>(generatedImage);
  const [imageProvider, setImageProvider] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [generationAttempts, setGenerationAttempts] = useState(0);
  const [retryInfo, setRetryInfo] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Set current step on mount
  useEffect(() => {
    setCurrentStep(3);
  }, [setCurrentStep]);

  // Dynamic phase messages that include brand context
  const phaseMessages = getPhaseMessages(
    brand?.name || 'Your Brand',
    product?.type || 'Product'
  );

  useEffect(() => {
    // Check if user has required context
    if (!brand || !product) {
      toast.warning("Please complete the previous steps first");
      navigate('/step1');
      return;
    }

    // If we already have a generated image from context, use it
    if (generatedImage) {
      setLocalImage(generatedImage);
      setIsGenerating(false);
      setPhase('complete');
      setProgress(100);
    } else {
      // Generate new image
      handleGenerateImage();
    }
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const updatePhase = (newPhase: GenerationPhase, progressValue: number) => {
    setPhase(newPhase);
    setProgress(progressValue);
  };

  // Aggregate ALL user inputs from Step 1 and Step 2
  const buildPayload = (): ImageGenerationPayload => {
    // Determine the final creative brief (prioritize selected idea card, then manual brief)
    const finalBrief = selectedIdeaPrompt || creativeBrief || 
      `Create a modern, professional ${product?.type} visual for ${brand?.name}`;
    
    // Build comprehensive payload with ALL user inputs
    return {
      // From Step 1 (Brand)
      brandSource: brand?.isCustom ? 'custom' : 'library',
      brandName: brand?.name || 'Brand',
      brandColors: brand ? [brand.colors.primary, brand.colors.secondary] : ['#7C3AED', '#3B82F6'],
      productType: product?.type || 'Marketing Visual',
      brandLogo: brand?.logoUrl || brand?.logo || null,
      brandFont: brand?.font || 'Outfit',
      
      // From Step 2 (Creative)
      creativeBrief: finalBrief,
      
      // Generation settings
      width: 1920,
      height: 1080,
      style: 'professional',
    };
  };

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    setLocalImage(null);
    setErrorMessage("");
    setRetryInfo("");
    setProgress(0);
    setPhase('preparing');
    setGenerationAttempts(prev => prev + 1);

    // Create abort controller for this generation
    abortControllerRef.current = new AbortController();

    // Simulate phased progress
    const phaseTimer = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    try {
      // Phase 1: Preparing
      await phaseTimer(500);
      updatePhase('analyzing', 15);
      
      // Phase 2: Analyzing
      await phaseTimer(800);
      updatePhase('generating', 35);

      // Build comprehensive payload with ALL user inputs
      const payload = buildPayload();
      
      console.log('=== Sending to ai-image-generator ===');
      console.log('Brand Source:', payload.brandSource);
      console.log('Brand Name:', payload.brandName);
      console.log('Brand Colors:', payload.brandColors);
      console.log('Product Type:', payload.productType);
      console.log('Creative Brief:', payload.creativeBrief.substring(0, 100) + '...');
      console.log('Has Logo:', !!payload.brandLogo);
      console.log('Font:', payload.brandFont);

      // Make API call with 90-second timeout (image generation is heavy) and exponential backoff retry
      const { data, error, safetyFiltered } = await withExponentialBackoff<ImageGenerationResponse>(
        () => invokeEdgeFunction<ImageGenerationResponse>('ai-image-generator', payload as unknown as Record<string, unknown>, { timeoutMs: 90000 }),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt, delay) => {
            const message = `Retrying... (attempt ${attempt}/3, waiting ${delay / 1000}s)`;
            setRetryInfo(message);
            toast.info(message);
          }
        }
      );

      setRetryInfo("");

      // Handle safety filter - suggest different prompt
      if (safetyFiltered) {
        throw new Error('Your prompt was blocked by content filters. The system attempted a softened retry but it still failed. Please try a different prompt that avoids sensitive or inappropriate content.');
      }

      // Phase 3: Rendering
      updatePhase('rendering', 70);
      await phaseTimer(500);

      if (error) {
        throw error;
      }

      if (!data?.imageUrl) {
        throw new Error('No image was generated. Please try again.');
      }

      // Phase 4: Finalizing
      updatePhase('finalizing', 90);
      await phaseTimer(400);

      // Complete - Save to both local state and global context
      setLocalImage(data.imageUrl);
      setGeneratedImage(data.imageUrl); // Save to BrandContext for Step 4
      setImageProvider(data.provider || 'Gemini');
      updatePhase('complete', 100);
      toast.success(`Image generated successfully with ${data.provider || 'Gemini'}!`);

    } catch (error) {
      console.error('Error generating image:', error);
      updatePhase('error', 0);
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate image';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsGenerating(false);
      setRetryInfo("");
    }
  };

  const handleRegenerate = () => {
    // Clear the context image to force regeneration
    setGeneratedImage(null);
    handleGenerateImage();
  };

  const handleDownload = async () => {
    if (!localImage) return;

    try {
      // If it's a base64 image
      if (localImage.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = localImage;
        // Detect mime type from data URL
        const mimeMatch = localImage.match(/data:([^;]+);/);
        const extension = mimeMatch ? mimeMatch[1].split('/')[1] : 'png';
        link.download = `${brand?.name || 'visual'}-${product?.type || 'design'}-${Date.now()}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Image download started!');
        return;
      }

      // If it's a URL, fetch and download
      const response = await fetch(localImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${brand?.name || 'visual'}-${product?.type || 'design'}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image. Please try right-clicking and saving.');
    }
  };

  if (!brand || !product) {
    return null;
  }

  return (
    <motion.div 
      className="min-h-screen bg-background noise-overlay py-8 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto">
        <StepHeader 
          currentStep={3}
          title="Generate Visual"
          description="Creating your high-fidelity visual based on your creative brief"
        />

        {/* Brand Context Reminder - Enhanced with ALL inputs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="p-4 glass bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-start gap-4 flex-wrap">
              {/* Brand Info */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-white shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.secondary})` 
                  }}
                >
                  {brand.logo && !brand.logoUrl ? (
                    <span>{brand.logo}</span>
                  ) : brand.logoUrl ? (
                    <img src={brand.logoUrl} alt={brand.name} className="w-6 h-6 object-contain" />
                  ) : (
                    <Building2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{brand.name}</span>
                    <Badge variant={brand.isCustom ? "default" : "outline"} className="text-xs">
                      {brand.isCustom ? 'Custom' : 'Library'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1">
                      <div 
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: brand.colors.primary }}
                        title={brand.colors.primary}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: brand.colors.secondary }}
                        title={brand.colors.secondary}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{brand.font}</span>
                  </div>
                </div>
              </div>

              <div className="w-px h-12 bg-border hidden sm:block" />
              
              {/* Product Type */}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Product Type</span>
                <Badge variant="secondary" className="text-sm">
                  {product.type}
                </Badge>
              </div>

              <div className="w-px h-12 bg-border hidden sm:block" />

              {/* Creative Brief Preview */}
              <div className="flex-1 min-w-[200px]">
                <span className="text-xs text-muted-foreground mb-1 block">Creative Brief</span>
                <p className="text-sm text-foreground line-clamp-2">
                  {selectedIdeaPrompt || creativeBrief || 'Default prompt'}
                </p>
              </div>

              {/* Provider Badge */}
              {imageProvider && (
                <>
                  <div className="w-px h-12 bg-border hidden sm:block" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground mb-1">Provider</span>
                    <Badge variant="outline" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {imageProvider}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </Card>
        </motion.div>

        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-12 text-center glass overflow-hidden relative">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: `linear-gradient(135deg, ${brand.colors.primary}40, ${brand.colors.secondary}40)`,
                  }}
                />

                <div className="relative z-10">
                  {/* Animated Icon */}
                  <motion.div
                    animate={{ 
                      rotate: phase === 'error' ? 0 : 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                      scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="mb-6"
                  >
                    {phase === 'error' ? (
                      <AlertCircle className="w-20 h-20 text-destructive mx-auto" />
                    ) : phase === 'complete' ? (
                      <Check className="w-20 h-20 text-primary mx-auto" />
                    ) : (
                      <div 
                        className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
                        style={{ 
                          background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.secondary})` 
                        }}
                      >
                        <Wand2 className="w-10 h-10 text-white" />
                      </div>
                    )}
                  </motion.div>

                  {/* Phase Title - Dynamic with brand context */}
                  <motion.h3 
                    key={phase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold text-foreground mb-2 tracking-tight"
                  >
                    {phaseMessages[phase].title}
                  </motion.h3>

                  <motion.p 
                    key={`desc-${phase}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-muted-foreground mb-8"
                  >
                    {phaseMessages[phase].description}
                  </motion.p>

                  {/* Inputs Being Processed */}
                  {phase !== 'error' && phase !== 'complete' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-6 p-3 bg-secondary/30 rounded-lg max-w-md mx-auto"
                    >
                      <p className="text-xs text-muted-foreground mb-2">Processing your inputs:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge variant="outline" className="text-xs">
                          <Palette className="w-3 h-3 mr-1" />
                          {brand.name}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {product.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {brand.font}
                        </Badge>
                      </div>
                    </motion.div>
                  )}

                  {/* Retry Info */}
                  {retryInfo && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-4 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg"
                    >
                      <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {retryInfo}
                      </p>
                    </motion.div>
                  )}

                  {/* Progress Bar */}
                  {phase !== 'error' && (
                    <div className="max-w-md mx-auto">
                      <Progress value={progress} className="h-3 mb-3" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-primary">{progress}%</span>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {phase === 'error' && (
                    <div className="mt-6 space-y-4">
                      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <p className="text-sm text-destructive">{errorMessage}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button onClick={handleRegenerate} variant="outline">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Try Again
                        </Button>
                        <Button onClick={() => navigate('/step2')} variant="ghost">
                          Edit Creative Brief
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Generation Attempt Counter */}
                  {generationAttempts > 1 && phase !== 'complete' && (
                    <p className="text-xs text-muted-foreground mt-4">
                      Attempt {generationAttempts}
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              className="space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-2 glass overflow-hidden">
                <div className="relative aspect-video rounded-xl overflow-hidden">
                  {/* Glowing Border with Brand Colors */}
                  <div 
                    className="absolute -inset-[2px] rounded-xl opacity-50"
                    style={{ 
                      background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.secondary})` 
                    }}
                  />
                  
                  <div className="relative rounded-xl overflow-hidden bg-card m-[2px] group">
                    {localImage ? (
                      <>
                        <motion.img 
                          src={localImage} 
                          alt={`Generated ${product.type} visual for ${brand.name}`}
                          className="w-full h-full object-cover min-h-[400px]"
                          initial={{ opacity: 0, scale: 1.05 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                        />
                        {/* Fullscreen Button Overlay */}
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsFullscreen(true)}
                          className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-black/80 rounded-xl text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                          title="View Fullscreen"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </motion.button>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary to-card flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                          <Image className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-lg text-muted-foreground">No image generated</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRegenerate}
                            className="mt-4"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Generate Again
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Info */}
                {localImage && (
                  <div className="px-4 py-3 bg-secondary/30 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Generated with {imageProvider}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {brand.name}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {product.type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        1920 × 1080
                      </Badge>
                    </div>
                  </div>
                )}
              </Card>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Regenerate
                </Button>
                {localImage && (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
                <Button 
                  variant="hero" 
                  size="lg" 
                  onClick={() => navigate('/step4')} 
                  className="glow-primary"
                  disabled={!localImage}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Customize Design
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen Image Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Image Info Badge */}
            <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {brand?.name}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {product?.type}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                1920 × 1080
              </Badge>
            </div>
            
            {/* Full Size Image */}
            {localImage && (
              <img 
                src={localImage} 
                alt={`Generated ${product?.type} visual for ${brand?.name}`}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            )}
            
            {/* Bottom Actions */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setIsFullscreen(false);
                  navigate('/step4');
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Customize
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
