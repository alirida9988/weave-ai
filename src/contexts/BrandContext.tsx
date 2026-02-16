import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface BrandInfo {
  id: string;
  name: string;
  logo: string | null;
  logoUrl: string | null;
  colors: {
    primary: string;
    secondary: string;
  };
  font: string;
  isCustom: boolean;
}

export interface ProductInfo {
  type: string;
  description: string;
}

// Project data for saving/loading
export interface ProjectData {
  id: string;
  brand: BrandInfo;
  product: ProductInfo;
  creativeBrief: string;
  currentStep: number;
  generatedImage?: string;
  finalVisualUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface BrandContextType {
  brand: BrandInfo | null;
  setBrand: (brand: BrandInfo | null) => void;
  product: ProductInfo | null;
  setProduct: (product: ProductInfo | null) => void;
  creativeBrief: string;
  setCreativeBrief: (brief: string) => void;
  selectedIdeaPrompt: string | null;
  setSelectedIdeaPrompt: (prompt: string | null) => void;
  ideaGenerationCount: number;
  incrementIdeaCount: () => void;
  resetIdeaCount: () => void;
  // Step 3 -> Step 4: Generated image from AI
  generatedImage: string | null;
  setGeneratedImage: (image: string | null) => void;
  // Step 4 -> Step 5: Final customized visual (public URL from Supabase)
  finalVisualUrl: string | null;
  setFinalVisualUrl: (url: string | null) => void;
  // Step 4 -> Step 5: Final visual as base64 for fallback download
  finalVisualBase64: string | null;
  setFinalVisualBase64: (base64: string | null) => void;
  // Project tracking
  currentStep: number;
  setCurrentStep: (step: number) => void;
  projectId: string | null;
  setProjectId: (id: string | null) => void;
  // Check if project has data
  hasActiveProject: boolean;
  // Actions
  clearAll: () => void;
  createNewProject: () => string; // Returns new project ID
  saveCurrentProject: () => ProjectData | null; // Save current state to localStorage projects array
  loadProject: (projectId: string) => boolean; // Load a specific project
  getAllProjects: () => ProjectData[]; // Get all saved projects
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

// Generate UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Available fonts for brand customization
export const availableFonts = [
  { name: 'Outfit', family: 'Outfit, sans-serif', style: 'Modern & Clean' },
  { name: 'Playfair Display', family: '"Playfair Display", serif', style: 'Elegant & Classic' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif', style: 'Bold & Professional' },
  { name: 'Lora', family: 'Lora, serif', style: 'Refined & Literary' },
  { name: 'Poppins', family: 'Poppins, sans-serif', style: 'Friendly & Approachable' },
  { name: 'Raleway', family: 'Raleway, sans-serif', style: 'Sophisticated & Minimal' },
  { name: 'Merriweather', family: 'Merriweather, serif', style: 'Traditional & Trustworthy' },
  { name: 'Nunito', family: 'Nunito, sans-serif', style: 'Rounded & Warm' },
];

// Preset brands
export const presetBrands: BrandInfo[] = [
  { 
    id: 'tech-startup', 
    name: 'Tech Startup', 
    logo: '🚀', 
    logoUrl: null,
    colors: { primary: '#7C3AED', secondary: '#3B82F6' },
    font: 'Outfit',
    isCustom: false
  },
  { 
    id: 'eco-brand', 
    name: 'Eco Brand', 
    logo: '🌱', 
    logoUrl: null,
    colors: { primary: '#10B981', secondary: '#065F46' },
    font: 'Nunito',
    isCustom: false
  },
  { 
    id: 'luxury-brand', 
    name: 'Luxury Brand', 
    logo: '💎', 
    logoUrl: null,
    colors: { primary: '#D946EF', secondary: '#7C3AED' },
    font: 'Playfair Display',
    isCustom: false
  },
  { 
    id: 'health-wellness', 
    name: 'Health & Wellness', 
    logo: '🧘', 
    logoUrl: null,
    colors: { primary: '#14B8A6', secondary: '#0891B2' },
    font: 'Poppins',
    isCustom: false
  },
  { 
    id: 'finance-corp', 
    name: 'Finance Corp', 
    logo: '📊', 
    logoUrl: null,
    colors: { primary: '#1E40AF', secondary: '#0F172A' },
    font: 'Montserrat',
    isCustom: false
  },
];

// localStorage key for projects array
const PROJECTS_STORAGE_KEY = 'weaveProjects';

export const BrandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [brand, setBrandState] = useState<BrandInfo | null>(null);
  const [product, setProductState] = useState<ProductInfo | null>(null);
  const [creativeBrief, setCreativeBriefState] = useState<string>('');
  const [selectedIdeaPrompt, setSelectedIdeaPrompt] = useState<string | null>(null);
  const [ideaGenerationCount, setIdeaGenerationCount] = useState<number>(0);
  const [generatedImage, setGeneratedImageState] = useState<string | null>(null);
  const [finalVisualUrl, setFinalVisualUrlState] = useState<string | null>(null);
  const [finalVisualBase64, setFinalVisualBase64State] = useState<string | null>(null);
  const [currentStep, setCurrentStepState] = useState<number>(1);
  const [projectId, setProjectIdState] = useState<string | null>(null);

  // Load current project from localStorage on mount
  useEffect(() => {
    const savedBrand = localStorage.getItem('brandInfo');
    const savedProduct = localStorage.getItem('productInfo');
    const savedBrief = localStorage.getItem('creativeBrief');
    const savedIdeaCount = localStorage.getItem('ideaGenerationCount');
    const savedIdeaPrompt = localStorage.getItem('selectedIdeaPrompt');
    const savedGeneratedImage = localStorage.getItem('generatedImage');
    const savedFinalVisualUrl = localStorage.getItem('finalVisualUrl');
    const savedCurrentStep = localStorage.getItem('currentStep');
    const savedProjectId = localStorage.getItem('projectId');

    if (savedBrand) {
      try {
        setBrandState(JSON.parse(savedBrand));
      } catch (e) {
        console.error('Failed to parse saved brand:', e);
      }
    }
    if (savedProduct) {
      try {
        setProductState(JSON.parse(savedProduct));
      } catch (e) {
        console.error('Failed to parse saved product:', e);
      }
    }
    if (savedBrief) {
      setCreativeBriefState(savedBrief);
    }
    if (savedIdeaCount) {
      setIdeaGenerationCount(parseInt(savedIdeaCount, 10) || 0);
    }
    if (savedIdeaPrompt) {
      setSelectedIdeaPrompt(savedIdeaPrompt);
    }
    if (savedGeneratedImage) {
      setGeneratedImageState(savedGeneratedImage);
    }
    if (savedFinalVisualUrl) {
      setFinalVisualUrlState(savedFinalVisualUrl);
    }
    if (savedCurrentStep) {
      setCurrentStepState(parseInt(savedCurrentStep, 10) || 1);
    }
    if (savedProjectId) {
      setProjectIdState(savedProjectId);
    }
  }, []);

  const setBrand = (newBrand: BrandInfo | null) => {
    setBrandState(newBrand);
    if (newBrand) {
      localStorage.setItem('brandInfo', JSON.stringify(newBrand));
    } else {
      localStorage.removeItem('brandInfo');
    }
  };

  const setProduct = (newProduct: ProductInfo | null) => {
    setProductState(newProduct);
    if (newProduct) {
      localStorage.setItem('productInfo', JSON.stringify(newProduct));
    } else {
      localStorage.removeItem('productInfo');
    }
  };

  const setCreativeBrief = (brief: string) => {
    setCreativeBriefState(brief);
    localStorage.setItem('creativeBrief', brief);
  };

  const incrementIdeaCount = () => {
    const newCount = ideaGenerationCount + 1;
    setIdeaGenerationCount(newCount);
    localStorage.setItem('ideaGenerationCount', newCount.toString());
  };

  const resetIdeaCount = () => {
    setIdeaGenerationCount(0);
    localStorage.setItem('ideaGenerationCount', '0');
  };

  const setGeneratedImage = (image: string | null) => {
    setGeneratedImageState(image);
    if (image) {
      try {
        localStorage.setItem('generatedImage', image);
      } catch (e) {
        console.warn('Failed to save generated image to localStorage (too large):', e);
      }
    } else {
      localStorage.removeItem('generatedImage');
    }
  };

  const setFinalVisualUrl = (url: string | null) => {
    setFinalVisualUrlState(url);
    if (url) {
      localStorage.setItem('finalVisualUrl', url);
    } else {
      localStorage.removeItem('finalVisualUrl');
    }
  };

  const setFinalVisualBase64 = (base64: string | null) => {
    setFinalVisualBase64State(base64);
    // Don't persist to localStorage (too large)
  };

  const setCurrentStep = (step: number) => {
    setCurrentStepState(step);
    localStorage.setItem('currentStep', step.toString());
    localStorage.setItem('hasStartedProject', 'true');
  };

  const setProjectId = (id: string | null) => {
    setProjectIdState(id);
    if (id) {
      localStorage.setItem('projectId', id);
    } else {
      localStorage.removeItem('projectId');
    }
  };

  // Check if there's an active project with any data
  const hasActiveProject = Boolean(
    brand || product || creativeBrief || generatedImage || currentStep > 1
  );

  // Get all saved projects from localStorage
  const getAllProjects = useCallback((): ProjectData[] => {
    try {
      const projectsStr = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (projectsStr) {
        return JSON.parse(projectsStr) as ProjectData[];
      }
    } catch (e) {
      console.error('Failed to parse saved projects:', e);
    }
    return [];
  }, []);

  // Save current project to the projects array (does NOT overwrite other projects)
  const saveCurrentProject = useCallback((): ProjectData | null => {
    if (!brand || !product || !projectId) {
      console.warn('[BrandContext] Cannot save: missing brand, product, or projectId');
      return null;
    }

    const now = new Date().toISOString();
    const projectData: ProjectData = {
      id: projectId,
      brand,
      product,
      creativeBrief,
      currentStep,
      generatedImage: generatedImage || undefined,
      finalVisualUrl: finalVisualUrl || undefined,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const existingProjects = getAllProjects();
      
      // Find existing project index
      const existingIndex = existingProjects.findIndex(p => p.id === projectId);
      
      if (existingIndex >= 0) {
        // Update existing project (preserve createdAt)
        projectData.createdAt = existingProjects[existingIndex].createdAt;
        existingProjects[existingIndex] = projectData;
      } else {
        // Add new project (at the beginning)
        existingProjects.unshift(projectData);
      }

      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(existingProjects));
      console.log('[BrandContext] Project saved:', projectId);
      return projectData;
    } catch (e) {
      console.error('Failed to save project:', e);
      return null;
    }
  }, [brand, product, projectId, creativeBrief, currentStep, generatedImage, finalVisualUrl, getAllProjects]);

  // Load a specific project by ID
  const loadProject = useCallback((targetProjectId: string): boolean => {
    const projects = getAllProjects();
    const project = projects.find(p => p.id === targetProjectId);

    if (!project) {
      console.warn('[BrandContext] Project not found:', targetProjectId);
      return false;
    }

    console.log('[BrandContext] Loading project:', targetProjectId);

    // Restore state
    setBrand(project.brand);
    setProduct(project.product);
    setCreativeBrief(project.creativeBrief);
    setCurrentStep(project.currentStep);
    setProjectId(project.id);
    
    if (project.generatedImage) {
      setGeneratedImage(project.generatedImage);
    }
    if (project.finalVisualUrl) {
      setFinalVisualUrl(project.finalVisualUrl);
    }

    // Reset idea-related state
    setSelectedIdeaPrompt(null);
    resetIdeaCount();
    setFinalVisualBase64State(null);

    return true;
  }, [getAllProjects]);

  // Clear ALL current state (but does NOT delete saved projects)
  const clearAll = useCallback(() => {
    console.log('[BrandContext] Clearing all current state...');
    
    setBrandState(null);
    setProductState(null);
    setCreativeBriefState('');
    setSelectedIdeaPrompt(null);
    setIdeaGenerationCount(0);
    setGeneratedImageState(null);
    setFinalVisualUrlState(null);
    setFinalVisualBase64State(null);
    setCurrentStepState(1);
    setProjectIdState(null);
    
    // Clear current project from localStorage
    localStorage.removeItem('brandInfo');
    localStorage.removeItem('productInfo');
    localStorage.removeItem('creativeBrief');
    localStorage.removeItem('ideaGenerationCount');
    localStorage.removeItem('selectedIdeaPrompt');
    localStorage.removeItem('generatedImage');
    localStorage.removeItem('finalVisualUrl');
    localStorage.removeItem('currentStep');
    localStorage.removeItem('projectId');
    localStorage.removeItem('hasStartedProject');
    
    console.log('[BrandContext] All current state cleared');
  }, []);

  // Create a completely fresh project with a NEW UUID
  const createNewProject = useCallback((): string => {
    console.log('[BrandContext] Creating NEW PROJECT with fresh UUID...');
    
    // First, save the current project if it has data
    if (brand && product && projectId) {
      console.log('[BrandContext] Saving current project before creating new:', projectId);
      saveCurrentProject();
    }
    
    // Clear all current state
    clearAll();
    
    // Generate new UUID for the project
    const newProjectId = generateUUID();
    setProjectIdState(newProjectId);
    localStorage.setItem('projectId', newProjectId);
    
    console.log('[BrandContext] New project created with ID:', newProjectId);
    return newProjectId;
  }, [brand, product, projectId, saveCurrentProject, clearAll]);

  return (
    <BrandContext.Provider
      value={{
        brand,
        setBrand,
        product,
        setProduct,
        creativeBrief,
        setCreativeBrief,
        selectedIdeaPrompt,
        setSelectedIdeaPrompt,
        ideaGenerationCount,
        incrementIdeaCount,
        resetIdeaCount,
        generatedImage,
        setGeneratedImage,
        finalVisualUrl,
        setFinalVisualUrl,
        finalVisualBase64,
        setFinalVisualBase64,
        currentStep,
        setCurrentStep,
        projectId,
        setProjectId,
        hasActiveProject,
        clearAll,
        createNewProject,
        saveCurrentProject,
        loadProject,
        getAllProjects,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = (): BrandContextType => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};
