import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Palette, Plus, Library, Search, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StepHeader } from "@/components/StepHeader";
import { motion, AnimatePresence } from "framer-motion";
import { useBrand, presetBrands, availableFonts, BrandInfo } from "@/contexts/BrandContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

export const Step1 = () => {
  const navigate = useNavigate();
  const {
    brand,
    setBrand,
    product,
    setProduct,
    setCurrentStep,
    setCreativeBrief,
    setSelectedIdeaPrompt,
    setGeneratedImage,
    resetIdeaCount,
    clearAll,
  } = useBrand();

  // Set current step on mount
  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  // Reset selections when returning from Google OAuth (fresh session)
  useEffect(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('oauthPending') === '1') {
      clearAll();
      setProductInput('');
      sessionStorage.removeItem('oauthPending');
    }
  }, [clearAll]);

  // Sync product input with context when product is cleared
  useEffect(() => {
    setProductInput(product?.type ?? '');
  }, [product]);

  // Clear previous run's ideas and image when landing on Step 1 so Step 2/3 start fresh
  useEffect(() => {
    setCreativeBrief('');
    setSelectedIdeaPrompt(null);
    setGeneratedImage(null);
    resetIdeaCount();
    localStorage.removeItem('selectedIdeaPrompt');
  }, [setCreativeBrief, setSelectedIdeaPrompt, setGeneratedImage, resetIdeaCount]);
  
  // Brand creation state
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandPrimaryColor, setNewBrandPrimaryColor] = useState("#7C3AED");
  const [newBrandSecondaryColor, setNewBrandSecondaryColor] = useState("#3B82F6");
  const [newBrandFont, setNewBrandFont] = useState("Outfit");
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product input state
  const [productInput, setProductInput] = useState(product?.type || "");

  // Product suggestions for autocomplete
  const productSuggestions = [
    "SaaS Dashboard",
    "Mobile App",
    "E-commerce Platform",
    "Landing Page",
    "Marketing Campaign",
    "Social Media Content",
    "Brand Identity",
    "Physical Product Packaging",
    "Digital Course",
    "Newsletter",
    "Presentation Deck",
    "Video Thumbnail",
  ];

  const [showSuggestions, setShowSuggestions] = useState(false);
  const filteredSuggestions = productSuggestions.filter(
    (s) => s.toLowerCase().includes(productInput.toLowerCase()) && productInput.length > 0
  );

  const handleSelectBrand = (selectedBrand: BrandInfo) => {
    setBrand(selectedBrand);
    toast.success(`Selected ${selectedBrand.name}`);
  };

  const handleRemoveBrand = () => {
    setBrand(null);
    localStorage.removeItem('brandInfo');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be less than 2MB");
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Create a local preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedLogo(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Optional: Upload to Supabase Storage
      // const fileName = `logos/${Date.now()}-${file.name}`;
      // const { data, error } = await supabase.storage
      //   .from('brand-assets')
      //   .upload(fileName, file);
      // if (error) throw error;
      // const { data: urlData } = supabase.storage
      //   .from('brand-assets')
      //   .getPublicUrl(fileName);
      // setUploadedLogo(urlData.publicUrl);

      toast.success("Logo uploaded successfully!");
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error("Failed to upload logo. Please try again.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCreateBrand = () => {
    if (!newBrandName.trim()) {
      toast.error("Please enter a brand name");
      return;
    }

    const customBrand: BrandInfo = {
      id: `custom-${Date.now()}`,
      name: newBrandName,
      logo: null,
      logoUrl: uploadedLogo,
      colors: {
        primary: newBrandPrimaryColor,
        secondary: newBrandSecondaryColor,
      },
      font: newBrandFont,
      isCustom: true,
    };

    setBrand(customBrand);
    setShowBrandDialog(false);
    toast.success(`Created and selected "${newBrandName}"`);

    // Reset form
    setNewBrandName("");
    setUploadedLogo(null);
  };

  const handleProductSelect = useCallback((value: string) => {
    setProductInput(value);
    setProduct({ type: value, description: value });
    setShowSuggestions(false);
  }, [setProduct]);

  const handleContinue = () => {
    if (!brand) {
      toast.error("Please select or create a brand");
      return;
    }
    if (!productInput.trim()) {
      toast.error("Please describe your product");
      return;
    }

    setProduct({ type: productInput, description: productInput });
    navigate('/step2');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-background noise-overlay py-8 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-5xl mx-auto">
        <StepHeader 
          currentStep={1}
          title="Define Your Brand & Product"
          description="Select your brand identity or create a new one, then describe your product"
        />

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Brand Selection */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3 tracking-tight">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary-foreground" />
              </div>
              Select Your Brand
            </h2>
            
            {/* Brand Library */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Library className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Choose from library</span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {presetBrands.map((presetBrand) => (
                  <motion.div 
                    key={presetBrand.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`p-4 cursor-pointer glass transition-all ${
                        brand != null && String(brand.id) === String(presetBrand.id)
                          ? 'border-primary bg-primary/10 shadow-border-glow' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleSelectBrand(presetBrand)}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ 
                            background: `linear-gradient(135deg, ${presetBrand.colors.primary}, ${presetBrand.colors.secondary})` 
                          }}
                        >
                          {presetBrand.logo}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{presetBrand.name}</h3>
                          <div className="flex gap-1 mt-1">
                            <div 
                              className="w-4 h-4 rounded-full border border-border/50"
                              style={{ backgroundColor: presetBrand.colors.primary }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full border border-border/50"
                              style={{ backgroundColor: presetBrand.colors.secondary }}
                            />
                            <span className="text-xs text-muted-foreground ml-2">{presetBrand.font}</span>
                          </div>
                        </div>
                        {brand != null && String(brand.id) === String(presetBrand.id) && (
                          <Badge className="bg-primary text-primary-foreground">
                            <Check className="w-3 h-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Create New Brand Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card 
                className="p-6 text-center border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all cursor-pointer glass bg-primary/5"
                onClick={() => setShowBrandDialog(true)}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Create New Brand</h3>
                <p className="text-sm text-muted-foreground">Upload logo, pick colors & fonts</p>
              </Card>
            </motion.div>

            {/* Custom Brand Display */}
            {brand?.isCustom && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <Card className="p-4 border-primary bg-primary/10">
                  <div className="flex items-center gap-3">
                    {brand.logoUrl ? (
                      <img 
                        src={brand.logoUrl} 
                        alt={brand.name} 
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ 
                          background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.secondary})` 
                        }}
                      >
                        <span className="text-white font-bold text-sm">
                          {brand.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{brand.name}</h3>
                      <div className="flex gap-1 mt-1">
                        <div 
                          className="w-4 h-4 rounded-full border border-border/50"
                          style={{ backgroundColor: brand.colors.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-border/50"
                          style={{ backgroundColor: brand.colors.secondary }}
                        />
                        <span className="text-xs text-muted-foreground ml-2">{brand.font}</span>
                      </div>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">
                      <Check className="w-3 h-3 mr-1" />
                      Custom
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>

          {/* Product Input */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3 tracking-tight">
              <div className="w-10 h-10 rounded-xl bg-gradient-creative flex items-center justify-center">
                <Search className="w-5 h-5 text-creative-foreground" />
              </div>
              Describe Your Product
            </h2>
            
            <Card className="p-6 glass">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="productInput" className="text-sm font-medium text-muted-foreground mb-2 block">
                    What digital product are you creating today?
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="productInput"
                      placeholder="e.g., SaaS Dashboard, Mobile App, Marketing Campaign..."
                      value={productInput}
                      onChange={(e) => {
                        setProductInput(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="pl-10 bg-secondary/50 border-border focus:border-primary h-12"
                    />
                    {productInput && (
                      <button
                        onClick={() => {
                          setProductInput("");
                          setProduct(null);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Suggestions Dropdown */}
                  <AnimatePresence>
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
                      >
                        {filteredSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleProductSelect(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors text-sm text-foreground flex items-center gap-2"
                          >
                            <Search className="w-3 h-3 text-muted-foreground" />
                            {suggestion}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Quick Select Tags */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Quick select
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {["SaaS Dashboard", "Mobile App", "E-commerce", "Landing Page", "Social Media"].map((tag) => (
                      <Badge
                        key={tag}
                        variant={productInput === tag ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          productInput === tag 
                            ? 'bg-accent text-accent-foreground' 
                            : 'hover:bg-secondary'
                        }`}
                        onClick={() => handleProductSelect(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Selected Product Preview */}
                {productInput && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-accent/10 border border-accent/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Check className="w-4 h-4 text-accent shrink-0" />
                      <span className="text-sm font-medium text-foreground">Product Selected:</span>
                      <Badge variant="outline" className="bg-accent/20 border-accent/30">
                        {productInput}
                      </Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => {
                                setProduct(null);
                                setProductInput('');
                              }}
                              className="ml-1 p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                              aria-label="Remove product selection"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove selection</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>

            {/* Context Preview */}
            {brand && productInput && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <Card className="p-4 glass border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Your Creative Context
                  </h4>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={brand.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                          style={{ 
                            background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.secondary})` 
                          }}
                        >
                          {brand.logo || brand.name.substring(0, 1)}
                        </div>
                      )}
                      <span className="text-sm font-medium text-foreground">{brand.name}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveBrand();
                              }}
                              className="p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                              aria-label="Remove brand selection"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove selection</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-sm">
                        {productInput}
                      </Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => {
                                setProduct(null);
                                setProductInput('');
                              }}
                              className="p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                              aria-label="Remove product selection"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove selection</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button 
            variant="hero" 
            size="xl" 
            onClick={handleContinue}
            disabled={!brand || !productInput.trim()}
            className="glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Ideas
          </Button>
          {(!brand || !productInput.trim()) && (
            <p className="text-sm text-muted-foreground mt-3">
              {!brand ? "Please select or create a brand" : "Please describe your product"} to continue
            </p>
          )}
        </motion.div>
      </div>

      {/* Create Brand Dialog */}
      <Dialog open={showBrandDialog} onOpenChange={setShowBrandDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto glass">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Brand</DialogTitle>
            <DialogDescription>
              Define your brand identity with custom colors, fonts, and logo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 pt-4">
            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                placeholder="Enter your brand name"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                className="bg-secondary/50"
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                <div 
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadedLogo ? (
                    <img src={uploadedLogo} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className={`w-6 h-6 text-muted-foreground ${isUploadingLogo ? 'animate-pulse' : ''}`} />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={newBrandPrimaryColor}
                    onChange={(e) => setNewBrandPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <Input
                    value={newBrandPrimaryColor}
                    onChange={(e) => setNewBrandPrimaryColor(e.target.value)}
                    className="flex-1 bg-secondary/50 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={newBrandSecondaryColor}
                    onChange={(e) => setNewBrandSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <Input
                    value={newBrandSecondaryColor}
                    onChange={(e) => setNewBrandSecondaryColor(e.target.value)}
                    className="flex-1 bg-secondary/50 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div 
              className="h-16 rounded-xl"
              style={{ 
                background: `linear-gradient(135deg, ${newBrandPrimaryColor}, ${newBrandSecondaryColor})` 
              }}
            />

            {/* Font Selection */}
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select value={newBrandFont} onValueChange={setNewBrandFont}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableFonts.map((font) => (
                    <SelectItem key={font.name} value={font.name}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: font.family }}>{font.name}</span>
                        <span className="text-xs text-muted-foreground">• {font.style}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Preview */}
            <div 
              className="p-4 bg-secondary/30 rounded-lg text-center"
              style={{ fontFamily: availableFonts.find(f => f.name === newBrandFont)?.family }}
            >
              <p className="text-2xl font-bold text-foreground">
                {newBrandName || 'Your Brand Name'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                The quick brown fox jumps over the lazy dog
              </p>
            </div>

            {/* Create Button */}
            <Button 
              onClick={handleCreateBrand} 
              className="w-full"
              disabled={!newBrandName.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Brand
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
