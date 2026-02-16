import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { Step1 } from "./pages/steps/Step1";
import { Step2 } from "./pages/steps/Step2";
import { Step3 } from "./pages/steps/Step3";
import { Step4 } from "./pages/steps/Step4";
import { Step5 } from "./pages/steps/Step5";
import Projects from "./pages/Projects";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/step1" element={<ProtectedRoute><Step1 /></ProtectedRoute>} />
        <Route path="/step2" element={<ProtectedRoute><Step2 /></ProtectedRoute>} />
        <Route path="/step3" element={<ProtectedRoute><Step3 /></ProtectedRoute>} />
        <Route path="/step4" element={<ProtectedRoute><Step4 /></ProtectedRoute>} />
        <Route path="/step5" element={<ProtectedRoute><Step5 /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <BrandProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </BrandProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
