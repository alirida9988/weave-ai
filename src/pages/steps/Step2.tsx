import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lightbulb, Target, Sparkles, Wand2, Edit, Palette, Box, AlertCircle, Check, Zap, Camera, Sun, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StepHeader } from "@/components/StepHeader";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { invokeEdgeFunction } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";

interface IdeaCard {
  id: string;
  category: string;
  title: string;
  description: string;
  prompt: string;
  style: string;
  colorAccent: string;
}

const categoryIcons: Record<string, typeof Lightbulb> = {
  "Minimalist": Zap,
  "Cinematic": Camera,
  "Vibrant": Sun,
  "Professional": Briefcase,
};

const categoryGradients: Record<string, string> = {
  "Minimalist": "from-slate-500 to-zinc-600",
  "Cinematic": "from-amber-500 to-orange-600",
  "Vibrant": "from-pink-500 to-rose-600",
  "Professional": "from-blue-600 to-indigo-700",
};

export const Step2 = () => {
  const navigate = useNavigate();
  const { 
    brand, 
    product, 
    creativeBrief, 
    setCreativeBrief, 
    selectedIdeaPrompt, 
    setSelectedIdeaPrompt,
    ideaGenerationCount,
    incrementIdeaCount,
    setCurrentStep,
    setGeneratedImage
  } = useBrand();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRephrasing, setIsRephrasing] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [showIdeaCards, setShowIdeaCards] = useState(false);
  const [ideaCards, setIdeaCards] = useState<IdeaCard[]>([]);

  const MAX_IDEA_GENERATIONS = 4;
  const remainingGenerations = MAX_IDEA_GENERATIONS - ideaGenerationCount;

  // Set current step on mount
  useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  // Check if user came without brand/product context
  useEffect(() => {
    if (!brand || !product) {
      toast.warning("Please select a brand and product first");
      setTimeout(() => navigate('/step1'), 1500);
    }
  }, [brand, product, navigate]);

  const handleAIRephrase = async () => {
    if (!creativeBrief.trim()) {
      toast.error("Please enter your creative brief first");
      return;
    }
    
    setIsRephrasing(true);
    try {
      const { data, error } = await invokeEdgeFunction('ai-creative-assistant', {
        action: 'rephrase',
        creativeBrief: creativeBrief,
        brandInfo: brand,
        productType: product?.type
      });

      if (error) {
        throw error;
      }
      
      if (data?.result) {
        setCreativeBrief(data.result);
        toast.success("Creative brief enhanced for image generation!");
      } else {
        throw new Error('No result returned from AI');
      }
    } catch (error) {
      console.error('Error rephrasing brief:', error);
      toast.error(
        error instanceof Error 
          ? `Enhancement failed: ${error.message}` 
          : "Failed to enhance brief. Please try again."
      );
    } finally {
      setIsRephrasing(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (remainingGenerations <= 0) {
      toast.error("You've used all your idea generations. Please proceed with the current selection.");
      return;
    }

    // Clear previous selection, textarea, and Step 3 image so new ideas are the only focus
    setSelectedIdea(null);
    setSelectedIdeaPrompt(null);
    setCreativeBrief('');
    setGeneratedImage(null);

    setIsGenerating(true);
    try {
      const { data, error } = await invokeEdgeFunction('ai-creative-assistant', {
        action: 'generateIdeas',
        creativeBrief: creativeBrief,
        brandInfo: brand,
        productType: product?.type
      });

      if (error) {
        throw error;
      }

      if (data?.result?.ideas && Array.isArray(data.result.ideas)) {
        setIdeaCards(data.result.ideas);
        setShowIdeaCards(true);
        incrementIdeaCount();
        toast.success(`Generated ${data.result.ideas.length} creative concepts! (${remainingGenerations - 1} generations remaining)`);
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      toast.error(
        error instanceof Error 
          ? `Generation failed: ${error.message}` 
          : "Failed to generate ideas. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectIdea = (idea: IdeaCard) => {
    setSelectedIdea(idea.id);
    setCreativeBrief(idea.prompt);
    setSelectedIdeaPrompt(idea.prompt);
    toast.success(`Selected: ${idea.title}`);
  };

  const handleCreateVisual = () => {
    if (!creativeBrief.trim()) {
      toast.error("Please enter a creative brief or select an idea");
      return;
    }
    navigate('/step3');
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
      <div className="max-w-6xl mx-auto">
        <StepHeader 
          currentStep={2}
          title="Generate Creative Ideas"
          description="Describe your vision or let AI generate stunning concepts"
        />

        {/* Context Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-4 glass bg-gradient-to-r from-primary/5 via-transparent to-accent/5 border-primary/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                {/* Brand Display */}
                <div className="flex items-center gap-3">
                  <Palette className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Your Brand:</span>
                  <div className="flex items-center gap-2">
                    {brand.logoUrl ? (
                      <img src={brand.logoUrl} alt={brand.name} className="w-6 h-6 rounded-md object-cover" />
                    ) : (
                      <div 
                        className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                        style={{ 
                          background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.secondary})` 
                        }}
                      >
                        {brand.logo || brand.name.substring(0, 1)}
                      </div>
                    )}
                    <span className="font-medium text-foreground">{brand.name}</span>
                    <div className="flex gap-1 ml-1">
                      <div 
                        className="w-3 h-3 rounded-full border border-border/50"
                        style={{ backgroundColor: brand.colors.primary }}
                      />
                      <div 
                        className="w-3 h-3 rounded-full border border-border/50"
                        style={{ backgroundColor: brand.colors.secondary }}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-px h-6 bg-border" />

                {/* Product Display */}
                <div className="flex items-center gap-3">
                  <Box className="w-4 h-4 text-accent" />
                  <span className="text-sm text-muted-foreground">Product:</span>
                  <Badge variant="outline" className="bg-accent/10 border-accent/30">
                    {product.type}
                  </Badge>
                </div>
              </div>

              {/* Generations Remaining */}
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-creative" />
                <span className="text-sm text-muted-foreground">
                  Idea generations: 
                  <span className={`font-bold ml-1 ${remainingGenerations <= 1 ? 'text-destructive' : 'text-creative'}`}>
                    {remainingGenerations}/{MAX_IDEA_GENERATIONS}
                  </span>
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Creative Brief Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 mb-8 glass">
            <div className="flex items-center gap-2 mb-4">
              <Edit className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold text-foreground tracking-tight">Creative Brief</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="creativeBrief" className="text-sm font-medium text-muted-foreground mb-2 block">
                  Describe your creative vision, purpose, and goals
                </Label>
                <Textarea
                  id="creativeBrief"
                  placeholder={`e.g., Create a ${product.type} visual for ${brand.name} that captures modern elegance with bold colors and clean typography...`}
                  value={creativeBrief}
                  onChange={(e) => setCreativeBrief(e.target.value)}
                  className="min-h-[140px] resize-none bg-secondary/50 border-border focus:border-primary"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAIRephrase}
                  disabled={isRephrasing || !creativeBrief.trim()}
                  className="flex-1"
                >
                  {isRephrasing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                    </motion.div>
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  {isRephrasing ? 'Enhancing...' : 'Enhance Brief'}
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleGenerateIdeas}
                  disabled={isGenerating || remainingGenerations <= 0}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                >
                  {isGenerating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                    </motion.div>
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate Ideas'}
                </Button>
              </div>

              {remainingGenerations <= 0 && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">
                    You've used all idea generations. Please proceed with the current brief.
                  </span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Idea Cards Section */}
        <AnimatePresence>
          {showIdeaCards && ideaCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-creative" />
                <h3 className="text-lg font-semibold text-foreground">Generated Concepts</h3>
                <Badge variant="outline" className="ml-2">Click to select</Badge>
              </div>

              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {ideaCards.map((idea) => {
                  const Icon = categoryIcons[idea.category] || Lightbulb;
                  const gradient = categoryGradients[idea.category] || "from-primary to-accent";
                  const isSelected = selectedIdea === idea.id;

                  return (
                    <motion.div 
                      key={idea.id} 
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`p-5 cursor-pointer transition-all h-full relative overflow-hidden group ${
                          isSelected 
                            ? 'border-2 border-primary bg-primary/10 shadow-border-glow' 
                            : 'border-border hover:border-primary/50 glass'
                        }`}
                        onClick={() => handleSelectIdea(idea)}
                      >
                        {/* Category Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <Badge 
                            className={`bg-gradient-to-r ${gradient} text-white border-0`}
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {idea.category}
                          </Badge>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-primary-foreground" />
                            </motion.div>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-lg font-bold text-foreground mb-2 tracking-tight line-clamp-2">
                          {idea.title}
                        </h4>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {idea.description}
                        </p>

                        {/* Style Keywords */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <Target className="w-3 h-3" />
                          <span className="line-clamp-1">{idea.style}</span>
                        </div>

                        {/* Color Accent Bar */}
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-1 transition-all group-hover:h-2"
                          style={{ backgroundColor: idea.colorAccent }}
                        />

                        {/* Hover Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isSelected ? 'opacity-100' : ''}`} />
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Idea Preview */}
        <AnimatePresence>
          {selectedIdea && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8"
            >
              <Card className="p-4 bg-primary/5 border-primary/30">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Selected Concept:</span>
                  <span className="text-muted-foreground">
                    {ideaCards.find(i => i.id === selectedIdea)?.title}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {creativeBrief}
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="flex justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button 
            variant="hero" 
            size="lg" 
            onClick={handleCreateVisual} 
            className="glow-primary"
            disabled={!creativeBrief.trim()}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create Visual
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};
