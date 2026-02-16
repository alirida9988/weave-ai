import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  X, 
  Send, 
  Sparkles,
  ChevronDown,
  Palette
} from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface BrandContext {
  brandName?: string;
  colors?: { primary: string; secondary: string };
  productType?: string;
  currentStep?: number;
}

// Intent categories for fuzzy matching
const INTENT_PATTERNS = {
  save: [
    /save|saving|saved/i,
    /download|downloading|export|exporting/i,
    /get.*file|get.*image|get.*visual/i,
    /how.*save|where.*save/i,
    /keep.*work|preserve/i
  ],
  brand: [
    /brand|branding|identity/i,
    /logo|color|colour|font|typography/i,
    /style.*guide|brand.*kit/i,
    /customize.*brand|change.*brand/i
  ],
  generate: [
    /generate|create|make|build/i,
    /ai.*image|image.*generation/i,
    /visual|graphic|design/i,
    /step.*3|generation.*step/i
  ],
  customize: [
    /edit|editing|customize|customiz/i,
    /drag.*drop|canvas|editor/i,
    /add.*text|add.*logo|overlay/i,
    /step.*4|customiz.*step/i
  ],
  pricing: [
    /price|pricing|cost|pay|subscription/i,
    /plan|tier|free|premium|pro/i,
    /how.*much|afford/i
  ],
  help: [
    /help|support|assist|issue|problem/i,
    /stuck|confused|don.*know/i,
    /contact|reach.*out/i
  ],
  greeting: [
    /^(hi|hello|hey|howdy|greetings)/i,
    /good.*(morning|afternoon|evening)/i,
    /what.*up/i
  ],
  thanks: [
    /thank|thanks|thx|appreciate|grateful/i
  ],
  howItWorks: [
    /how.*work|how.*use|explain|workflow/i,
    /process|steps|getting.*started/i
  ],
  features: [
    /feature|what.*can|capabilities|offer/i,
    /function|ability/i
  ],
  socialMedia: [
    /social.*media|instagram|facebook|twitter|linkedin|tiktok/i,
    /post|story|reel|thumbnail/i
  ],
  formats: [
    /format|size|dimension|resolution/i,
    /png|jpg|svg|pdf/i,
    /print|web|mobile/i
  ]
};

// Match intent from user message
const matchIntent = (message: string): string[] => {
  const matchedIntents: string[] = [];
  
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        matchedIntents.push(intent);
        break;
      }
    }
  }
  
  return matchedIntents;
};

// Generate response based on intent and brand context
const generateResponse = (question: string, brandContext: BrandContext): string => {
  const q = question.toLowerCase().trim();
  const intents = matchIntent(q);
  
  // Personalized greeting if brand is set
  const brandGreeting = brandContext.brandName 
    ? `I see you're working on "${brandContext.brandName}" (${brandContext.productType || 'project'}). ` 
    : '';

  // Handle specific intents
  if (intents.includes('greeting')) {
    return `Hello! 👋 I'm your Brand Consultant at Weave. ${brandGreeting}How can I help elevate your creative work today?`;
  }
  
  if (intents.includes('thanks')) {
    return `You're welcome! ${brandContext.brandName ? `Best of luck with ${brandContext.brandName}! ` : ''}If you need more guidance on brand strategy or visual design, I'm here. ✨`;
  }
  
  if (intents.includes('save')) {
    const stepHint = brandContext.currentStep 
      ? `Since you're on Step ${brandContext.currentStep}, ` 
      : '';
    
    return `${stepHint}Here's how to save and download your work:\n\n` +
      `📥 **Quick Save:** Click the "Save" button in the top-right corner at any step.\n\n` +
      `📤 **Export Final Visual:** In Step 5, you can:\n` +
      `• Download in multiple formats (Instagram, A4, HD, etc.)\n` +
      `• Generate a shareable cloud link\n` +
      `• Get print-ready files\n\n` +
      `${brandContext.brandName ? `Your "${brandContext.brandName}" project progress is auto-saved!` : 'All your progress is auto-saved!'}`;
  }
  
  if (intents.includes('brand')) {
    if (brandContext.brandName && brandContext.colors) {
      return `I can see your brand "${brandContext.brandName}" is set up with:\n\n` +
        `🎨 **Colors:** Primary (${brandContext.colors.primary}) and Secondary (${brandContext.colors.secondary})\n` +
        `📦 **Product:** ${brandContext.productType || 'Not specified'}\n\n` +
        `**Pro Tip:** These colors will automatically influence your AI-generated visuals. Want to:\n` +
        `• Adjust colors? Go back to Step 1\n` +
        `• Add a logo? Use the editor in Step 4\n\n` +
        `A strong brand identity creates 3x more recognition!`;
    }
    return `Your brand kit in Weave includes:\n\n` +
      `🎨 **Colors:** Primary & secondary brand colors\n` +
      `✍️ **Typography:** Font family selection\n` +
      `🖼️ **Logo:** Upload your brand mark\n\n` +
      `Set these up in Step 1, and every visual you generate will automatically match your brand identity!`;
  }
  
  if (intents.includes('generate')) {
    const contextHint = brandContext.brandName 
      ? `For "${brandContext.brandName}", ` 
      : '';
    
    return `${contextHint}Here's how AI generation works in Weave:\n\n` +
      `1️⃣ **Step 2:** Write or refine your creative brief\n` +
      `2️⃣ **AI Concepts:** Get 4 unique prompt suggestions\n` +
      `3️⃣ **Step 3:** Click "Generate" to create your visual\n\n` +
      `🎯 **Pro Tips:**\n` +
      `• Be specific in your brief (mood, style, elements)\n` +
      `• Use the "Rephrase" button for better prompts\n` +
      `• Your brand colors are automatically applied!\n\n` +
      `Generation takes 15-30 seconds for high-quality results.`;
  }
  
  if (intents.includes('customize')) {
    return `The Step 4 editor gives you pro-level control:\n\n` +
      `🖱️ **Drag & Drop:** Move any element freely\n` +
      `📝 **Text:** Add headlines, taglines, CTAs\n` +
      `🖼️ **Logos:** Upload or use your brand logo\n` +
      `🔲 **Shapes:** Add rectangles & circles for emphasis\n` +
      `✨ **Effects:** Adjust opacity, layers, and filters\n\n` +
      `**Keyboard Shortcuts:**\n` +
      `• Delete: Remove selected element\n` +
      `• Double-click text: Edit content\n\n` +
      `${brandContext.brandName ? `Your "${brandContext.brandName}" colors are available in the color palette!` : ''}`;
  }
  
  if (intents.includes('pricing')) {
    return `Weave offers flexible plans:\n\n` +
      `🆓 **Free Trial:** Full access to explore\n` +
      `⭐ **Starter:** Perfect for solo creators\n` +
      `🚀 **Pro:** For growing teams & agencies\n` +
      `🏢 **Enterprise:** Custom solutions & API access\n\n` +
      `All plans include AI generation, brand kit storage, and multi-format exports. Visit our pricing page for details!`;
  }
  
  if (intents.includes('help')) {
    return `I'm here to help! 💬\n\n` +
      `**Quick Resources:**\n` +
      `• Chat with me anytime for instant answers\n` +
      `• Email: support@weave.ai\n` +
      `• Help Center: Tutorials & FAQs\n\n` +
      `**Common Solutions:**\n` +
      `• Generation stuck? Try refreshing the page\n` +
      `• Upload failed? Check file size (<2MB)\n` +
      `• Canvas issues? Clear browser cache\n\n` +
      `What specific challenge can I help you with?`;
  }
  
  if (intents.includes('howItWorks')) {
    return `Weave's 5-step creative workflow:\n\n` +
      `**Step 1:** 🎨 Define your brand (colors, fonts, logo)\n` +
      `**Step 2:** 📝 Write your creative brief\n` +
      `**Step 3:** ⚡ AI generates stunning visuals\n` +
      `**Step 4:** 🖱️ Customize with drag-and-drop editor\n` +
      `**Step 5:** 📤 Export in any format\n\n` +
      `Each step builds on the last, ensuring brand consistency throughout. Most users complete a project in under 10 minutes!`;
  }
  
  if (intents.includes('features')) {
    return `Weave's powerful features:\n\n` +
      `✨ **Brand-First Design:** Automatic brand consistency\n` +
      `🧠 **AI Creative Concepts:** Tailored to your brand\n` +
      `⚡ **Instant Generation:** High-quality in seconds\n` +
      `🖱️ **Pro Editor:** Layers, shapes, filters\n` +
      `📁 **Multi-Format Export:** Social, web, print\n` +
      `☁️ **Cloud Sharing:** Instant team links\n\n` +
      `${brandContext.brandName ? `Ready to leverage these for "${brandContext.brandName}"?` : 'Ready to get started?'}`;
  }
  
  if (intents.includes('socialMedia')) {
    return `Weave is perfect for social media! 📱\n\n` +
      `**Pre-sized Formats:**\n` +
      `• Instagram: Posts, Stories, Reels\n` +
      `• Facebook: Posts & Cover Photos\n` +
      `• Twitter/X: Headers & Posts\n` +
      `• LinkedIn: Banners & Content\n` +
      `• TikTok: Thumbnails\n\n` +
      `In Step 5, select your platform and download - automatically sized and optimized!`;
  }
  
  if (intents.includes('formats')) {
    return `Supported export formats:\n\n` +
      `**Digital:**\n` +
      `• PNG/JPG - Web & social (optimized)\n` +
      `• Multiple resolutions (1080p, 4K)\n\n` +
      `**Print:**\n` +
      `• PDF - High-resolution print\n` +
      `• A4/Letter - Document ready\n` +
      `• Custom sizes available\n\n` +
      `${brandContext.brandName ? `For "${brandContext.brandName}", I recommend starting with the platform-specific presets in Step 5.` : ''}`;
  }
  
  // Default helpful response
  const defaultTopics = [
    '• How Weave works',
    '• Saving & downloading',
    '• Brand customization',
    '• AI generation tips',
    '• Editor features',
    '• Export formats',
  ];
  
  return `I'm your Brand Consultant, here to help! ${brandGreeting}\n\n` +
    `I can assist with:\n${defaultTopics.join('\n')}\n\n` +
    `What would you like to know more about?`;
};

export const Chatbot = () => {
  const { brand, product, currentStep } = useBrand();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  // Build brand context for personalized responses
  const brandContext: BrandContext = {
    brandName: brand?.name,
    colors: brand?.colors,
    productType: product?.type,
    currentStep: currentStep,
  };

  // Generate initial greeting based on brand context - ONE consolidated message
  const getInitialGreeting = (): string => {
    if (brand && product) {
      return `Hi! 👋 I'm your Brand Consultant. I see you're working on "${brand.name}" (${product.type})—how can I help you refine your design or exports today?`;
    } else if (brand) {
      return `Hi! 👋 I'm your Brand Consultant. I see you're working on "${brand.name}"—how can I help you refine your design or exports today?`;
    }
    return "Hi! 👋 I'm your Brand Consultant at Weave. I can help with design strategy, platform guidance, and creative tips. What can I help you with today?";
  };

  // Initialize messages with dynamic greeting - only ONCE
  const [messages, setMessages] = useState<Message[]>(() => [{
    id: 1,
    text: getInitialGreeting(),
    isBot: true,
    timestamp: new Date(),
  }]);

  // Update greeting ONLY when brand changes and chat hasn't been used yet
  useEffect(() => {
    if (!hasInitialized.current && brand) {
      hasInitialized.current = true;
      setMessages([{
        id: 1,
        text: getInitialGreeting(),
        isBot: true,
        timestamp: new Date(),
      }]);
    }
  }, [brand?.name]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: text,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        text: generateResponse(text, brandContext),
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 600 + Math.random() * 600);
  };

  const handleSend = () => {
    sendMessage(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const quickQuestions = [
    "How do I save?",
    "Generate visuals",
    "Export formats",
  ];

  return (
    <>
      {/* Chat Button - Fixed position, z-50, always visible */}
      <motion.button
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-gradient-primary text-white shadow-lg hover:shadow-xl flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <Palette className="w-6 h-6" />
              <motion.div
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window - Constrained: max-width 350px, max-height 500px */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-20 right-4 z-50 w-[calc(100vw-32px)] max-w-[350px] h-[500px] max-h-[calc(100vh-100px)] rounded-2xl shadow-2xl overflow-hidden bg-white border border-border flex flex-col"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Header - Sticky at top */}
            <div className="bg-gradient-primary p-4 text-white relative overflow-hidden flex-shrink-0 sticky top-0 z-10">
              <motion.div
                className="absolute inset-0 bg-white/10"
                animate={{ x: [-200, 200] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{ width: "100px", transform: "skewX(-20deg)" }}
              />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Brand Consultant</h3>
                  <div className="flex items-center gap-1.5 text-xs text-white/80">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    {brand ? `Helping with ${brand.name}` : 'Ready to help'}
                  </div>
                </div>
              </div>
              <motion.button
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                onClick={() => setIsOpen(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Messages - Scrollable content area with overflow-y-auto */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-secondary/20 to-transparent">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl ${
                      message.isBot
                        ? "bg-white shadow-sm border border-border text-foreground rounded-tl-sm"
                        : "bg-gradient-primary text-white rounded-tr-sm"
                    }`}
                  >
                    {message.isBot && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-medium text-primary">Brand Consultant</span>
                      </div>
                    )}
                    <p className="text-xs leading-relaxed whitespace-pre-line">{message.text}</p>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="bg-white shadow-sm border border-border p-3 rounded-xl rounded-tl-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 bg-primary rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions - Context-Aware */}
            {messages.length <= 2 && (
              <div className="px-3 pb-2 flex-shrink-0">
                <div className="flex flex-wrap gap-1.5">
                  {quickQuestions.map((q, i) => (
                    <motion.button
                      key={i}
                      className="text-[10px] px-2.5 py-1.5 rounded-full bg-secondary hover:bg-primary hover:text-white transition-all text-muted-foreground"
                      onClick={() => handleQuickQuestion(q)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {q}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area - Sticky at bottom */}
            <div className="p-3 border-t border-border bg-white flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about design, exports..."
                  className="flex-1 h-9 rounded-xl bg-secondary/50 border-border focus:border-primary text-xs"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  variant="hero"
                  size="icon"
                  className="h-9 w-9 rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
