import { Card } from "@/components/ui/card";
import { 
  Palette, 
  Smartphone, 
  Monitor, 
  FileImage, 
  Zap, 
  Download,
  Settings,
  Sparkles,
  Layers
} from "lucide-react";
import { motion } from "framer-motion";

export const Features = () => {
  const features = [
    {
      icon: Palette,
      title: "Brand-First Design",
      description: "Upload your brand kit once. Every visual automatically matches your colors, fonts, and style guidelines.",
      gradient: "from-primary to-accent"
    },
    {
      icon: Sparkles,
      title: "Creative Concepts",
      description: "Get campaign concepts and visual directions tailored to your brand and marketing objectives.",
      gradient: "from-accent to-creative"
    },
    {
      icon: Zap,
      title: "Instant Generation",
      description: "Create high-quality visuals in seconds. From social posts to billboards—all formats covered.",
      gradient: "from-creative to-primary"
    },
    {
      icon: Settings,
      title: "Drag & Drop Editor",
      description: "Fine-tune every detail with our intuitive editor. Add text, adjust layouts, place logos effortlessly.",
      gradient: "from-primary to-accent"
    },
    {
      icon: Layers,
      title: "Multi-Format Export",
      description: "Export in any size or format. Perfect for social media, web, print, or large-scale advertising.",
      gradient: "from-accent to-creative"
    },
    {
      icon: Download,
      title: "Ready-to-Use Assets",
      description: "Download production-ready files immediately. No additional software or design skills required.",
      gradient: "from-creative to-primary"
    }
  ];

  const useCases = [
    { icon: Smartphone, title: "Social Media", formats: "Stories, Posts, Reels" },
    { icon: Monitor, title: "Web Banners", formats: "Hero, Display, CTA" },
    { icon: FileImage, title: "Print Ads", formats: "Flyers, Posters, Billboards" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-0 w-[250px] sm:w-[400px] md:w-[500px] h-[250px] sm:h-[400px] md:h-[500px] bg-accent/8 rounded-full blur-[80px] md:blur-[120px]"
          animate={{ 
            x: [0, 30, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-0 w-[200px] sm:w-[300px] md:w-[400px] h-[200px] sm:h-[300px] md:h-[400px] bg-primary/8 rounded-full blur-[60px] md:blur-[100px]"
          animate={{ 
            x: [0, -30, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-12 sm:mb-16 md:mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <motion.span 
            className="inline-block text-xs sm:text-sm font-semibold text-primary mb-3 sm:mb-4 tracking-wide uppercase px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Everything You Need
          </motion.span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 tracking-tighter px-2">
            Professional Visuals,
            <span className="gradient-text-creative block">Zero Design Skills</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Our platform handles the creative heavy lifting while you focus on your brand message.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-16 sm:mb-20 md:mb-24"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card 
                  className="p-5 sm:p-6 md:p-8 bg-white/90 backdrop-blur-sm border border-border shadow-sm h-full group transition-all duration-500 hover:shadow-xl hover:border-primary/20"
                >
                  <motion.div 
                    className={`w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 sm:mb-6 shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon className="w-6 h-6 sm:w-7 md:w-8 sm:h-7 md:h-8 text-white" />
                  </motion.div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3 tracking-tight group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Use Cases */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-8 sm:mb-12 tracking-tight">
            Perfect for Every Campaign
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <motion.div
                  key={index}
                  className="bg-white/90 backdrop-blur-sm border border-border p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm group hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                  whileHover={{ scale: 1.03, y: -8 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <motion.div 
                    className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 mx-auto shadow-lg"
                    whileHover={{ rotate: 10 }}
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </motion.div>
                  <h4 className="text-base sm:text-lg font-bold text-foreground mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                    {useCase.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {useCase.formats}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
