import { Button } from "@/components/ui/button";
import { 
  FolderOpen, 
  Lightbulb, 
  Image, 
  Edit, 
  Download,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export const Process = () => {
  const navigate = useNavigate();
  
  const steps = [
    {
      number: "01",
      icon: FolderOpen,
      title: "Select Your Brand",
      description: "Upload your brand kit with logos, colors, and fonts. Or choose from our curated brand templates.",
      gradient: "from-primary to-accent"
    },
    {
      number: "02", 
      icon: Lightbulb,
      title: "Generate Creative Ideas",
      description: "Get campaign concepts and visual directions tailored to your brand and marketing objectives.",
      gradient: "from-accent to-creative"
    },
    {
      number: "03",
      icon: Image,
      title: "Generate Visual",
      description: "Create high-quality visuals automatically based on the selected concept and your brand guidelines.",
      gradient: "from-creative to-primary"
    },
    {
      number: "04",
      icon: Edit,
      title: "Customize",
      description: "Fine-tune your visual with our drag-and-drop editor. Add text, adjust layouts, and place elements.",
      gradient: "from-primary to-accent"
    },
    {
      number: "05",
      icon: Download,
      title: "Download & Deploy",
      description: "Export in any format you need. Perfect for social media, web, print, or large-scale advertising.",
      gradient: "from-accent to-creative"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-0 left-1/4 w-[200px] sm:w-[300px] md:w-[400px] h-[200px] sm:h-[300px] md:h-[400px] bg-primary/8 rounded-full blur-[60px] md:blur-[100px]"
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-0 right-1/4 w-[150px] sm:w-[200px] md:w-[300px] h-[150px] sm:h-[200px] md:h-[300px] bg-accent/8 rounded-full blur-[50px] md:blur-[80px]"
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
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
            Simple Workflow
          </motion.span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 tracking-tighter px-2">
            From Concept to
            <span className="gradient-text block">Professional Visual</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Our streamlined workflow turns your ideas into stunning visuals in minutes, not hours.
          </p>
        </motion.div>

        {/* Process Steps - Responsive Layout */}
        <motion.div 
          className="relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {/* Vertical Line - Hidden on mobile, shown on md+ */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-creative -translate-x-px opacity-30" />
          
          {/* Mobile: Simple list | Desktop: Timeline */}
          <div className="space-y-6 md:space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className={`relative flex flex-col md:flex-row items-start md:items-center ${
                    isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Mobile: Icon + Content inline */}
                  <div className="flex md:hidden items-start gap-4 w-full">
                    {/* Icon */}
                    <motion.div 
                      className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <span className="text-[10px] font-bold tracking-wider text-primary mb-1 block">
                        STEP {step.number}
                      </span>
                      <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Desktop: Original Timeline Layout */}
                  <div className={`hidden md:block flex-1 ${isEven ? 'pr-16 text-right' : 'pl-16'}`}>
                    <motion.div
                      className="bg-white/90 backdrop-blur-sm border border-border p-6 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm group cursor-default hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                      whileHover={{ scale: 1.02, y: -5 }}
                      transition={{ duration: 0.4 }}
                    >
                      <motion.span 
                        className={`text-xs font-bold tracking-wider text-primary mb-3 block ${isEven ? 'text-right' : ''}`}
                        whileHover={{ scale: 1.1 }}
                      >
                        STEP {step.number}
                      </motion.span>
                      <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </motion.div>
                  </div>

                  {/* Desktop: Center Icon */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center">
                    <motion.div 
                      className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-xl z-10`}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                    </motion.div>
                  </div>

                  {/* Desktop: Empty Space */}
                  <div className="hidden md:block flex-1" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center mt-16 sm:mt-20 md:mt-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.div 
            className="bg-white/95 backdrop-blur-sm border border-border p-8 sm:p-10 md:p-12 rounded-2xl sm:rounded-3xl inline-block max-w-2xl mx-auto shadow-xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex justify-center mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
              </motion.div>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4 tracking-tight">
              Ready to Transform Your Creative Process?
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
              Join thousands of brands creating stunning visuals with Weave
            </p>
            <motion.div
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="hero" 
                size="xl" 
                className="w-full sm:w-auto glow-primary group"
                onClick={() => navigate('/auth')}
              >
                Start Creating Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
