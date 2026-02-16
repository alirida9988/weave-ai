import { motion, AnimatePresence } from "framer-motion";
import weaveLogo from "@/assets/weave-ai.png";

interface SplashScreenProps {
  isVisible: boolean;
}

export const SplashScreen = ({ isVisible }: SplashScreenProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Animated Background Gradient Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.2, 0.4],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />

          {/* Center Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo Container with Pulse Ring */}
            <div className="relative">
              {/* Pulse Rings */}
              <motion.div
                className="absolute inset-0 rounded-3xl bg-gradient-primary opacity-20"
                animate={{
                  scale: [1, 1.8],
                  opacity: [0.3, 0],
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 rounded-3xl bg-gradient-primary opacity-20"
                animate={{
                  scale: [1, 1.8],
                  opacity: [0.3, 0],
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              />

              {/* Logo */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.8,
                  ease: [0.175, 0.885, 0.32, 1.275],
                  delay: 0.2,
                }}
              >
                <motion.div
                  className="w-32 h-32 rounded-3xl bg-gradient-primary p-1 shadow-creative"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center overflow-hidden">
                    <img 
                      src={weaveLogo} 
                      alt="Weave" 
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Brand Name */}
            <motion.h1
              className="mt-8 text-5xl font-bold tracking-tight gradient-text"
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              Weave
            </motion.h1>

            {/* Tagline */}
            <motion.p
              className="mt-3 text-lg text-muted-foreground font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              Hand Your Brand's Future
            </motion.p>

            {/* Loading Indicator */}
            <motion.div
              className="mt-8 flex gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-primary"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Shimmer Line */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary"
            initial={{ scaleX: 0, transformOrigin: "left" }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2, ease: "easeInOut", delay: 0.3 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

