import { motion } from "framer-motion";
import { Sparkles, Palette, Move, Download, Zap, Layers, ArrowRight } from "lucide-react";

// Example showcase cards with different industries and prompts
const showcaseCards = [
  {
    id: 1,
    tag: "Health & Wellness",
    prompt: "Minimalist wellness logo with calming teal gradients",
    gradient: "from-teal-400 via-emerald-500 to-cyan-600",
    size: "normal",
  },
  {
    id: 2,
    tag: "SaaS",
    prompt: "Modern dashboard interface with purple accents",
    gradient: "from-violet-500 via-purple-600 to-indigo-700",
    size: "normal",
  },
  {
    id: 3,
    tag: "E-commerce",
    prompt: "Luxury product showcase with golden highlights",
    gradient: "from-amber-400 via-orange-500 to-rose-600",
    size: "normal",
  },
  {
    id: 4,
    tag: "Finance",
    prompt: "Professional banking app with trust-inspiring blues",
    gradient: "from-blue-500 via-indigo-600 to-slate-700",
    size: "normal",
  },
  {
    id: 5,
    tag: "Creative Agency",
    prompt: "Bold artistic composition with vibrant contrasts",
    gradient: "from-pink-500 via-fuchsia-600 to-purple-700",
    size: "normal",
  },
  {
    id: 6,
    tag: "Tech Startup",
    prompt: "Futuristic tech visualization with neon accents",
    gradient: "from-cyan-400 via-blue-500 to-violet-600",
    size: "normal",
  },
];

// Feature highlights
const featureHighlights = [
  {
    icon: Palette,
    step: "Steps 1-2",
    title: "Brand-First Intelligence",
    description: "Our AI understands your brand DNA—colors, fonts, and style—generating visuals that feel authentically yours.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Move,
    step: "Step 4",
    title: "Infinite Customization",
    description: "Drag-and-drop canvas with Fabric.js. Add logos, text overlays, and fine-tune every detail to perfection.",
    gradient: "from-cyan-500 to-teal-600",
  },
  {
    icon: Download,
    step: "Step 5",
    title: "Deploy Anywhere",
    description: "One-click exports for Instagram, LinkedIn, print-ready formats, and everything in between.",
    gradient: "from-orange-500 to-rose-600",
  },
];

export const VideoSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Purple/Teal gradient background */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-violet-500/20 to-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-teal-500/15 to-cyan-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <motion.div 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500/10 to-teal-500/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-foreground">Powered by Advanced AI</span>
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Create{" "}
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-teal-500 bg-clip-text text-transparent">
              Without Limits
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            See what's possible when your brand identity meets our advanced AI engine.
          </p>
        </motion.div>

        {/* Bento Grid Gallery */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-20"
        >
          {showcaseCards.map((card) => (
            <motion.div
              key={card.id}
              variants={cardVariants}
              className="relative group overflow-hidden rounded-2xl sm:rounded-3xl cursor-pointer"
              whileHover={{ scale: 1.03, y: -5 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Card Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
              
              {/* Animated Overlay Pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
              </div>
              
              {/* Shimmer Effect on Hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>

              {/* Content Container with Glassmorphism */}
              <div className="relative h-full flex flex-col justify-between p-5 sm:p-6 min-h-[200px] sm:min-h-[260px]">
                {/* Top: Tag */}
                <div className="flex items-start justify-between">
                  <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-xs font-semibold text-white shadow-lg">
                    {card.tag}
                  </span>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <ArrowRight className="w-4 h-4 text-white" />
                  </motion.div>
                </div>

                {/* Center: Decorative Elements */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-white/20 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute w-16 h-16 sm:w-20 sm:h-20 border border-white/30 rounded-xl rotate-45 opacity-40 group-hover:rotate-90 transition-transform duration-700" />
                </div>

                {/* Bottom: Prompt with Glassmorphism */}
                <div className="relative">
                  <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white/80" />
                      <span className="text-[10px] sm:text-xs font-medium text-white/70 uppercase tracking-wider">Prompt</span>
                    </div>
                    <p className="text-xs sm:text-sm text-white font-medium leading-relaxed line-clamp-2">
                      "{card.prompt}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Glow Effect */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500 -z-10`} />
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Section Divider */}
          <div className="flex items-center justify-center mb-12">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
            <div className="mx-4 flex items-center gap-2 text-muted-foreground">
              <Layers className="w-4 h-4" />
              <span className="text-sm font-medium">How It Works</span>
            </div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {featureHighlights.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  whileHover={{ y: -5 }}
                  className="group relative"
                >
                  <div className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/50 backdrop-blur-sm border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300">
                    {/* Icon */}
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>

                    {/* Step Badge */}
                    <span className="inline-block px-2.5 py-1 bg-secondary/80 rounded-full text-[10px] sm:text-xs font-semibold text-muted-foreground mb-3">
                      {feature.step}
                    </span>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 tracking-tight">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Hover Glow */}
                    <div className={`absolute -inset-1 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 blur-xl rounded-3xl transition-opacity duration-500 -z-10`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-4">
            Ready to transform your creative workflow?
          </p>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/auth'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Sparkles className="w-4 h-4" />
            Start Creating Free
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};
