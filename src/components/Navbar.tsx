import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, CreditCard, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import weaveLogo from "@/assets/weave-ai.png";

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-border/50 shadow-sm"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Branding - LARGER LOGO */}
          <motion.div 
            className="flex items-center gap-2 sm:gap-4 cursor-pointer group"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-gradient-primary rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"
              />
              <motion.div
                className="relative w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-primary p-0.5 shadow-lg"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-full h-full rounded-[10px] sm:rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                  <img 
                    src={weaveLogo} 
                    alt="Weave" 
                    className="w-8 h-8 sm:w-10 md:w-12 sm:h-10 md:h-12 object-contain transition-transform group-hover:scale-110 duration-300"
                  />
                </div>
              </motion.div>
            </div>
            <div className="flex flex-col">
              <motion.h1 
                className="text-lg sm:text-xl md:text-2xl font-bold gradient-text tracking-tight"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Weave
              </motion.h1>
              <motion.p 
                className="text-[10px] sm:text-xs text-muted-foreground font-medium tracking-wide hidden sm:block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Hand Your Brand's Future
              </motion.p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <User className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border-border shadow-lg">
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate('/step1')}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <motion.button 
                onClick={() => navigate('/auth')}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Join Us
              </motion.button>
            )}

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="hero" 
                size="default"
                onClick={() => navigate(user ? '/step1' : '/auth')}
                className="glow-primary"
              >
                {user ? 'Dashboard' : 'Get Started'}
              </Button>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden w-10 h-10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden pt-4 pb-2 border-t border-border/50 mt-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col gap-3">
                {user ? (
                  <>
                    <button 
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                      onClick={() => {
                        navigate('/step1');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <CreditCard className="w-4 h-4" />
                      Billing
                    </button>
                    <button 
                      className="flex items-center gap-2 text-sm text-destructive py-2"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      navigate('/auth');
                      setMobileMenuOpen(false);
                    }}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors py-2 text-left"
                  >
                    Join Us
                  </button>
                )}
                <Button 
                  variant="hero" 
                  className="w-full mt-2 glow-primary"
                  onClick={() => {
                    navigate(user ? '/step1' : '/auth');
                    setMobileMenuOpen(false);
                  }}
                >
                  {user ? 'Dashboard' : 'Get Started'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};
