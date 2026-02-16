import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="min-h-screen bg-background noise-overlay flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 text-center max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-8xl font-bold gradient-text mb-4">404</h1>
          <h2 className="text-2xl font-bold text-foreground mb-4 tracking-tight">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button variant="hero" onClick={() => navigate('/')} className="glow-primary">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NotFound;
