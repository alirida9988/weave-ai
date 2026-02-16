import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useState } from "react";

interface StepHeaderProps {
  currentStep: number;
  title: string;
  description: string;
}

export const StepHeader = ({ currentStep, title, description }: StepHeaderProps) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleBack = () => {
    if (currentStep === 1) {
      navigate('/');
    } else {
      navigate(`/step${currentStep - 1}`);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Save project progress
    localStorage.setItem('projectStarted', 'true');
    localStorage.setItem('lastStep', currentStep.toString());
    localStorage.setItem('projectTimestamp', new Date().toISOString());
    
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsSaving(false);
    setSaved(true);
    toast.success("Progress saved!");
    
    // Reset saved state after animation
    setTimeout(() => setSaved(false), 2000);
  };

  // Progress percentage
  const progress = (currentStep / 5) * 100;

  return (
    <motion.div 
      className="mb-12"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </Button>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                step === currentStep 
                  ? 'bg-primary w-6' 
                  : step < currentStep 
                    ? 'bg-primary/60' 
                    : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Save Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSave}
          disabled={isSaving}
          className="group min-w-[100px]"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-500" />
              Saved
            </>
          ) : isSaving ? (
            <>
              <Save className="w-4 h-4 mr-2 animate-pulse" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Save
            </>
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-border rounded-full mb-8 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Title Section */}
      <div className="text-center">
        <span className="inline-block text-sm font-medium text-primary mb-3 tracking-wide">
          Step {currentStep} of 5
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
          {title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {description}
        </p>
      </div>
    </motion.div>
  );
};
