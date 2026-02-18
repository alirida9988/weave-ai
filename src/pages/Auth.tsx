import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff,
  Sparkles,
  ArrowRight,
  Loader2
} from "lucide-react";
import weaveLogo from "@/assets/weave-ai.png";
import heroImage from "@/assets/hero-image-w.png";

export const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const { clearAll } = useBrand();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/step1');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!isLogin && !formData.name) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: "Sign In Failed",
            description: error.message || "Invalid email or password",
            variant: "destructive",
          });
        } else {
          clearAll();
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in",
          });
          navigate('/step1');
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) {
          toast({
            title: "Sign Up Failed",
            description: error.message || "Could not create account",
            variant: "destructive",
          });
        } else {
          clearAll();
          toast({
            title: "Account Created!",
            description: "Welcome to Weave! Let's get started.",
          });
          navigate('/step1');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Left Side - Decorative */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-gradient-primary p-8 xl:p-12 flex-col justify-between"
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        {/* Animated Background Patterns */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 -right-20 w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              y: [0, -50, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-xl xl:rounded-2xl bg-white/20 backdrop-blur-sm p-2">
              <img src={weaveLogo} alt="Weave" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-xl xl:text-2xl font-bold text-white">Weave</h2>
              <p className="text-xs xl:text-sm text-white/70">Hand Your Brand's Future</p>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 space-y-4 xl:space-y-6">
          <motion.h1 
            className="text-3xl xl:text-4xl 2xl:text-5xl font-bold text-white leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Create Stunning
            <br />
            <span className="text-white/90">Visuals in Minutes</span>
          </motion.h1>
          <motion.p 
            className="text-base xl:text-lg text-white/80 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Join thousands of brands transforming their creative process with AI-powered design tools.
          </motion.p>
          
          {/* Feature Pills */}
          <motion.div 
            className="flex flex-wrap gap-2 xl:gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {["AI Powered", "Brand Consistent", "Export Ready"].map((feature) => (
              <span
                key={feature}
                className="px-3 xl:px-4 py-1.5 xl:py-2 rounded-full bg-white/15 text-white text-xs xl:text-sm font-medium backdrop-blur-sm"
              >
                <Sparkles className="w-3 h-3 xl:w-4 xl:h-4 inline mr-1.5 xl:mr-2" />
                {feature}
              </span>
            ))}
          </motion.div>
        </div>

        <p className="relative z-10 text-white/60 text-xs xl:text-sm">
          © {new Date().getFullYear()} Weave. All rights reserved.
        </p>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        {/* Background Image for Mobile */}
        <div 
          className="lg:hidden absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        {/* Back Button */}
        <button
          className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-20"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium text-sm sm:text-base">Back</span>
        </button>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-primary p-0.5">
                <div className="w-full h-full rounded-[10px] sm:rounded-[14px] bg-white flex items-center justify-center">
                  <img src={weaveLogo} alt="Weave" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                </div>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold gradient-text">Weave</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Hand Your Brand's Future</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {isLogin 
                ? "Sign in to continue creating amazing visuals" 
                : "Start your creative journey with Weave"}
            </p>
          </div>

          {/* Form Card */}
          <Card className="p-5 sm:p-6 lg:p-8 bg-white border border-border shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="name" className="text-foreground font-medium text-sm">
                      Full Name
                    </Label>
                    <div className="relative mt-1.5 sm:mt-2">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="John Doe"
                        className="pl-10 sm:pl-11 h-10 sm:h-12 bg-white border-border focus:border-primary transition-all text-sm sm:text-base"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <Label htmlFor="email" className="text-foreground font-medium text-sm">
                  Email Address
                </Label>
                <div className="relative mt-1.5 sm:mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="pl-10 sm:pl-11 h-10 sm:h-12 bg-white border-border focus:border-primary transition-all text-sm sm:text-base"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-foreground font-medium text-sm">
                  Password
                </Label>
                <div className="relative mt-1.5 sm:mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    className="pl-10 sm:pl-11 pr-10 sm:pr-11 h-10 sm:h-12 bg-white border-border focus:border-primary transition-all text-sm sm:text-base"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {!isLogin && "Password must be at least 6 characters"}
                </p>
              </div>

              {isLogin && (
                <div className="flex justify-end">
                  <button type="button" className="text-xs sm:text-sm text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full h-10 sm:h-12 glow-primary group text-sm sm:text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-5 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-muted-foreground">or continue with</span>
              </div>
            </div>

            {/* Google Sign-In Only */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 sm:h-12 text-xs sm:text-sm"
              disabled={isLoading}
              onClick={async () => {
                const { error } = await signInWithGoogle();
                if (error) {
                  toast({
                    title: "Google sign-in failed",
                    description: error.message || "Please try again",
                    variant: "destructive",
                  });
                }
              }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </Card>

          {/* Toggle Auth Mode */}
          <p className="mt-6 sm:mt-8 text-center text-sm sm:text-base text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
