import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { VideoSection } from "@/components/VideoSection";
import { Features } from "@/components/Features";
import { Process } from "@/components/Process";
import { SplashScreen } from "@/components/SplashScreen";
import { Chatbot } from "@/components/Chatbot";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-image-w.png";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash screen after animation completes
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Splash Screen */}
      <SplashScreen isVisible={showSplash} />

      {/* Main Content */}
      <motion.div 
        className="min-h-screen bg-white relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Full Page Background Image - Clear and Visible */}
        <div 
          className="fixed inset-0 pointer-events-none"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.45,
            zIndex: 0
          }}
        />
        
        {/* Content Container - No overlay, just content */}
        <div className="relative z-10">
          <Hero />
          <VideoSection />
          <Features />
          <Process />
          
          {/* Footer */}
          <motion.footer 
            className="relative py-10 sm:py-12 md:py-16 px-4 sm:px-6 border-t border-border/50 bg-white/90"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                <motion.p 
                  className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  © {new Date().getFullYear()} Weave. All rights reserved.
                </motion.p>
                <motion.div 
                  className="flex flex-wrap justify-center gap-4 sm:gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                  <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </a>
                  <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                    Contact
                  </a>
                </motion.div>
              </div>
            </div>
          </motion.footer>

          {/* Chatbot */}
          <Chatbot />
        </div>
      </motion.div>
    </>
  );
};

export default Index;
