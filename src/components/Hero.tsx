import { Button } from "@/components/ui/button";
import { Wand2, ArrowRight, Sparkles, Play, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";

export const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveProject, currentStep, createNewProject, brand } = useBrand();

  // Handle creating a completely new project
  const handleCreateNew = () => {
    console.log('[Hero] Creating new project...');
    createNewProject();
    navigate('/step1');
  };

  // Handle resuming an existing project
  const handleResume = () => {
    console.log('[Hero] Resuming project at step:', currentStep);
    // Navigate to the last step the user was on
    navigate(`/step${currentStep}`);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 sm:pt-36 md:pt-40 pb-20">
      {/* Background Glows - Light Theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute top-1/4 -left-1/4 w-[300px] sm:w-[400px] md:w-[600px] h-[300px] sm:h-[400px] md:h-[600px] bg-primary/12 rounded-full blur-[100px] md:blur-[120px]"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 -right-1/4 w-[250px] sm:w-[350px] md:w-[500px] h-[250px] sm:h-[350px] md:h-[500px] bg-accent/10 rounded-full blur-[80px] md:blur-[100px]"
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-border px-3 sm:px-5 py-2 sm:py-2.5 rounded-full mb-6 sm:mb-8 shadow-sm"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
          >
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-full w-full bg-primary"></span>
            </span>
            <span className="text-xs sm:text-sm font-medium text-foreground">
              Professional Creative Platform
            </span>
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
          </motion.div>

          {/* Heading */}
          <motion.h1 
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground mb-4 sm:mb-6 leading-[1.1] tracking-tighter"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Create Stunning
            </motion.span>
            <motion.span 
              className="gradient-text block"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              Visuals in Minutes
            </motion.span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            className="text-sm sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            From social media posts to billboards—generate professional visuals, 
            customize with your brand, and export in any format.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {user && hasActiveProject ? (
              <>
                {/* Resume Project Button */}
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto"
                >
                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="w-full sm:w-auto group glow-primary"
                    onClick={handleResume}
                  >
                    <Play className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    Resume Project
                    {brand && (
                      <span className="ml-2 text-xs opacity-80">
                        ({brand.name} - Step {currentStep})
                      </span>
                    )}
                    <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </motion.div>
                
                {/* New Project Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto"
                >
                  <Button 
                    variant="outline" 
                    size="xl" 
                    className="w-full sm:w-auto group"
                    onClick={handleCreateNew}
                  >
                    <FolderOpen className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    New Project
                  </Button>
                </motion.div>

                {/* View All Projects Link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="w-full sm:w-auto"
                >
                  <Button 
                    variant="ghost" 
                    size="lg" 
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => navigate('/projects')}
                  >
                    View All Projects
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              </>
            ) : user ? (
              // User is logged in but no active project
              <>
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto"
                >
                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="w-full sm:w-auto group glow-primary"
                    onClick={handleCreateNew}
                  >
                    <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    Start New Project
                    <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </motion.div>
                
                {/* View All Projects Link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="w-full sm:w-auto"
                >
                  <Button 
                    variant="outline" 
                    size="xl" 
                    className="w-full sm:w-auto group"
                    onClick={() => navigate('/projects')}
                  >
                    <FolderOpen className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    View All Projects
                  </Button>
                </motion.div>
              </>
            ) : (
              // Not logged in
              <>
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto"
                >
                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="w-full sm:w-auto group glow-primary"
                    onClick={() => navigate('/auth')}
                  >
                    <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto"
                >
                  <Button 
                    variant="outline" 
                    size="xl" 
                    className="w-full sm:w-auto group"
                    onClick={() => navigate('/auth')}
                  >
                    Join Us
                    <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-4 sm:gap-8 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {[
              { value: "10k+", label: "Brands Trust Us" },
              { value: "1M+", label: "Visuals Created" },
              { value: "99%", label: "Satisfaction Rate" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center px-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                whileHover={{ scale: 1.1 }}
              >
                <div className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      {/* Scroll Indicator - Hidden on mobile */}
      <motion.div
        className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <motion.div
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1.5 h-3 bg-primary rounded-full"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};
