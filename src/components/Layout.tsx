import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { useBrand } from "@/contexts/BrandContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

// Step names for breadcrumb
const STEP_NAMES: Record<string, { number: number; title: string }> = {
  '/step1': { number: 1, title: 'Brand & Product' },
  '/step2': { number: 2, title: 'Creative Brief' },
  '/step3': { number: 3, title: 'Generate' },
  '/step4': { number: 4, title: 'Customize' },
  '/step5': { number: 5, title: 'Download' },
};

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { brand, hasActiveProject } = useBrand();
  
  // Check if we're in the step flow
  const isStepFlow = location.pathname.startsWith('/step');
  const currentStepInfo = STEP_NAMES[location.pathname];
  const showProjectBar = isStepFlow && hasActiveProject && brand;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Persistent Navbar - fixed at top, z-50 */}
      <Navbar />
      
      {/* Spacer for Navbar - pushes content below fixed navbar */}
      <div className="h-20 sm:h-24" />
      
      {/* Project Breadcrumb - NOT fixed, sits in normal flow */}
      <AnimatePresence>
        {showProjectBar && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-b border-border/30 shadow-sm"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
              <div className="flex items-center justify-between">
                {/* Left: Project Info */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Project:</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    {/* Brand indicator */}
                    <div 
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.secondary})` 
                      }}
                    >
                      {brand.logo || brand.name.substring(0, 1)}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[120px] sm:max-w-[180px]">
                      {brand.name}
                    </span>
                    
                    {/* Color swatches */}
                    <div className="hidden sm:flex items-center gap-0.5 ml-1">
                      <div 
                        className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-sm"
                        style={{ backgroundColor: brand.colors.primary }}
                      />
                      <div 
                        className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-sm"
                        style={{ backgroundColor: brand.colors.secondary }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Right: Step Progress */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {currentStepInfo && (
                    <>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground/50 flex-shrink-0" />
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">Step</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((step) => (
                            <div
                              key={step}
                              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                                step === currentStepInfo.number
                                  ? 'bg-primary scale-125'
                                  : step < currentStepInfo.number
                                  ? 'bg-primary/40'
                                  : 'bg-muted-foreground/20'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-foreground hidden sm:inline">
                          {currentStepInfo.title}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content - no extra padding needed, just render children */}
      <main>
        {children}
      </main>
    </div>
  );
};
