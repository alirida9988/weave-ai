import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Share, FileImage, Monitor, Printer, CheckCircle, Sparkles, RotateCcw, Copy, ExternalLink, Loader2, Link, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StepHeader } from "@/components/StepHeader";
import { motion } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Format configurations
interface FormatConfig {
  name: string;
  width: number;
  height: number;
  label: string;
}

const FORMAT_CONFIGS: Record<string, FormatConfig[]> = {
  'Social Media': [
    { name: 'Instagram Square', width: 1080, height: 1080, label: '1080×1080' },
    { name: 'Instagram Story', width: 1080, height: 1920, label: '1080×1920' },
    { name: 'Facebook Post', width: 1200, height: 628, label: '1200×628' },
    { name: 'Twitter/X Post', width: 1200, height: 675, label: '1200×675' },
  ],
  'Web': [
    { name: 'HD Landscape', width: 1920, height: 1080, label: '1920×1080' },
    { name: 'Hero Banner', width: 1200, height: 600, label: '1200×600' },
  ],
  'Print': [
    { name: 'A4 Portrait', width: 2480, height: 3508, label: '300 DPI A4' },
    { name: 'Square Print', width: 3000, height: 3000, label: '10×10 inch' },
  ],
};

export const Step5 = () => {
  const navigate = useNavigate();
  const { brand, product, finalVisualUrl, finalVisualBase64, clearAll, setCurrentStep, setFinalVisualUrl, projectId } = useBrand();
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  
  // Get image source - prefer base64 (more reliable)
  const imageSource = finalVisualBase64 || finalVisualUrl;

  useEffect(() => {
    setCurrentStep(5);
    console.log('[Step5] Mounted. Image source:', imageSource ? 'Available' : 'Missing');
  }, []);

  // Redirect if missing context
  useEffect(() => {
    if (!brand || !product) {
      toast.warning("Please complete the previous steps first");
      navigate('/step1');
    }
  }, [brand, product, navigate]);

  // Simple download function - creates a link and clicks it
  const triggerDownload = (dataUrl: string, filename: string) => {
    console.log('[Step5] Triggering download:', filename);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download with resizing
  const handleDownload = async (format: FormatConfig, category: string) => {
    console.log('[Step5] handleDownload called:', format.name);
    
    if (!imageSource) {
      toast.error('No image available');
      return;
    }

    const key = `${category}-${format.name}`;
    setDownloadingFormat(key);

    try {
      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load'));
        img.src = imageSource;
      });

      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = format.width;
      canvas.height = format.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('No canvas context');

      // Fill background with brand color
      ctx.fillStyle = brand?.colors.primary || '#1a1a2e';
      ctx.fillRect(0, 0, format.width, format.height);
      
      // Scale to cover
      const scale = Math.max(format.width / img.width, format.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (format.width - w) / 2;
      const y = (format.height - h) / 2;
      
      ctx.drawImage(img, x, y, w, h);

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const filename = `${brand?.name || 'weave'}-${format.name.replace(/\s+/g, '-')}-${format.width}x${format.height}.png`;
      triggerDownload(dataUrl, filename);
      
      toast.success(`Downloaded ${format.name}!`);
    } catch (error) {
      console.error('[Step5] Download error:', error);
      toast.error('Download failed');
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Download original
  const handleDownloadOriginal = () => {
    console.log('[Step5] handleDownloadOriginal called');
    
    if (!imageSource) {
      toast.error('No image available');
      return;
    }

    setDownloadingFormat('original');
    
    const filename = `${brand?.name || 'weave'}-original.png`;
    triggerDownload(imageSource, filename);
    toast.success('Original downloaded!');
    
    setDownloadingFormat(null);
  };

  // Generate shareable link
  const handleGenerateLink = async () => {
    console.log('[Step5] handleGenerateLink called');
    
    if (finalVisualUrl) {
      // Already have URL, just copy it
      await navigator.clipboard.writeText(finalVisualUrl);
      setCopiedLink(true);
      toast.success('Link copied!');
      setTimeout(() => setCopiedLink(false), 2000);
      return;
    }
    
    if (!finalVisualBase64 || !brand) {
      toast.error('No image to upload');
      return;
    }

    setIsGeneratingLink(true);

    try {
      // Convert base64 to blob
      const res = await fetch(finalVisualBase64);
      const blob = await res.blob();

      const filename = `${brand.name.replace(/\s+/g, '-')}-${Date.now()}.png`;
      const path = `visuals/${filename}`;

      // Upload to Supabase
      const { error } = await supabase.storage
        .from('final-visuals')
        .upload(path, blob, { contentType: 'image/png', upsert: true });

      if (error) {
        console.error('[Step5] Upload error:', error);
        toast.error('Upload failed: ' + error.message);
        return;
      }

      // Get public URL
      const { data } = supabase.storage.from('final-visuals').getPublicUrl(path);
      setFinalVisualUrl(data.publicUrl);
      
      await navigator.clipboard.writeText(data.publicUrl);
      setCopiedLink(true);
      toast.success('Link generated and copied!');
      setTimeout(() => setCopiedLink(false), 2000);

    } catch (error) {
      console.error('[Step5] Generate link error:', error);
      toast.error('Failed to generate link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Copy existing link
  const handleCopyLink = async () => {
    console.log('[Step5] handleCopyLink called');
    
    if (!finalVisualUrl) {
      await handleGenerateLink();
      return;
    }

    await navigator.clipboard.writeText(finalVisualUrl);
    setCopiedLink(true);
    toast.success('Link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartNew = () => {
    clearAll();
    navigate('/step1');
  };

  // Show loading if no context
  if (!brand || !product) {
    return null;
  }

  // Show error if no image
  if (!imageSource) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Visual Found</h2>
          <p className="text-muted-foreground mb-6">
            Go back to the editor and export your visual first.
          </p>
          <Button onClick={() => navigate('/step4')}>Go to Editor</Button>
        </Card>
      </div>
    );
  }

  const categories = [
    { name: 'Social Media', icon: Share, color: 'from-pink-500 to-rose-600' },
    { name: 'Web', icon: Monitor, color: 'from-blue-500 to-indigo-600' },
    { name: 'Print', icon: Printer, color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="min-h-[60vh] bg-background py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <StepHeader 
          currentStep={5}
          title="Download & Deploy"
          description="Export in any format you need"
        />

        {/* Success Banner */}
        <Card className="p-6 mb-8" style={{ background: `linear-gradient(135deg, ${brand.colors.primary}10, ${brand.colors.secondary}10)` }}>
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.secondary})` }}
            >
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Your Visual is Ready! 🎉</h2>
              <p className="text-muted-foreground text-sm">
                <span className="font-medium text-foreground">{brand.name}</span> • {product.type}
              </p>
            </div>
            <div className="hidden sm:block w-32 h-20 rounded-lg overflow-hidden border shadow">
              <img src={imageSource} alt="Preview" className="w-full h-full object-cover" />
            </div>
          </div>
        </Card>

        {/* Format Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const formats = FORMAT_CONFIGS[cat.name] || [];
            
            return (
              <Card key={cat.name} className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">{cat.name}</h3>
                </div>
                <div className="space-y-2">
                  {formats.map((format) => {
                    const key = `${cat.name}-${format.name}`;
                    const isLoading = downloadingFormat === key;
                    
                    return (
                      <div key={format.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border">
                        <div>
                          <span className="text-sm font-medium">{format.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">{format.label}</Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDownload(format, cat.name);
                          }}
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Download Original */}
          <Card className="p-8 text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.secondary})` }}
            >
              <FileImage className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Download Original</h3>
            <p className="text-muted-foreground mb-6 text-sm">Full resolution version</p>
            <Button 
              className="w-full"
              style={{ background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.secondary})` }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDownloadOriginal();
              }}
              disabled={downloadingFormat === 'original'}
            >
              {downloadingFormat === 'original' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Download Original
            </Button>
          </Card>

          {/* Share & Collaborate */}
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Share className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Share & Collaborate</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              {finalVisualUrl ? 'Link ready!' : 'Generate a shareable link'}
            </p>
            
            {!finalVisualUrl ? (
              <Button 
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleGenerateLink();
                }}
                disabled={isGeneratingLink}
              >
                {isGeneratingLink ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                ) : (
                  <><Link className="w-4 h-4 mr-2" />Generate Link</>
                )}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopyLink();
                  }}
                >
                  {copiedLink ? <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(finalVisualUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {finalVisualUrl && (
              <p className="text-xs text-muted-foreground mt-3 break-all">{finalVisualUrl.slice(0, 50)}...</p>
            )}
          </Card>
        </div>

        {/* Summary */}
        <Card className="p-6 mb-8">
          <h3 className="font-semibold mb-4">Project Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Brand</p>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.secondary})` }}
                >
                  {brand.name[0]}
                </div>
                <span className="font-medium truncate">{brand.name}</span>
              </div>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Product</p>
              <p className="font-medium truncate">{product.type}</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Font</p>
              <p className="font-medium">{brand.font}</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Colors</p>
              <div className="flex gap-1">
                <div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ backgroundColor: brand.colors.primary }} />
                <div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ backgroundColor: brand.colors.secondary }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="outline" size="lg" onClick={() => navigate('/step4')}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Back to Editor
          </Button>
          <Button variant="hero" size="lg" onClick={handleStartNew}>
            <Sparkles className="w-4 h-4 mr-2" />
            Start New Project
          </Button>
        </div>
      </div>
    </div>
  );
};
