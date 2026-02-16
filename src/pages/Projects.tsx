import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Clock, 
  ArrowRight,
  LayoutGrid,
  List,
  Image as ImageIcon,
  RefreshCw,
  Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useBrand, ProjectData } from "@/contexts/BrandContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Projects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    createNewProject, 
    loadProject, 
    getAllProjects,
    saveCurrentProject,
    brand,
    product,
    projectId
  } = useBrand();
  
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load projects from context (localStorage-based) and Supabase
  const loadProjects = async () => {
    setIsLoading(true);
    
    try {
      // Start with localStorage projects
      const localProjects = getAllProjects();
      console.log('[Projects] Loaded from localStorage:', localProjects.length);

      // Try to fetch from Supabase if user is authenticated
      if (user) {
        try {
          const { data: supabaseProjects, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

          if (!error && supabaseProjects && supabaseProjects.length > 0) {
            console.log('[Projects] Loaded from Supabase:', supabaseProjects.length);
            
            // Map Supabase data to ProjectData and merge with local
            const mappedProjects: ProjectData[] = supabaseProjects.map((p: any) => ({
              id: p.id,
              brand: {
                id: p.id,
                name: p.brand_name || 'Untitled',
                logo: null,
                logoUrl: null,
                colors: p.brand_colors || { primary: '#7C3AED', secondary: '#3B82F6' },
                font: p.brand_font || 'Outfit',
                isCustom: true,
              },
              product: {
                type: p.product_type || 'Unknown',
                description: p.product_type || '',
              },
              creativeBrief: p.creative_brief || '',
              currentStep: p.current_step || 1,
              generatedImage: p.thumbnail_url || undefined,
              finalVisualUrl: p.final_visual_url || undefined,
              createdAt: p.created_at,
              updatedAt: p.updated_at || p.created_at,
            }));
            
            // Merge: Supabase projects override local ones with same ID
            const mergedMap = new Map<string, ProjectData>();
            
            // Add local projects first
            localProjects.forEach(p => mergedMap.set(p.id, p));
            
            // Supabase projects override
            mappedProjects.forEach(p => mergedMap.set(p.id, p));
            
            const merged = Array.from(mergedMap.values());
            merged.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            
            setProjects(merged);
            setIsLoading(false);
            return;
          }
        } catch (supabaseError) {
          console.warn('[Projects] Supabase fetch failed:', supabaseError);
        }
      }

      // Fallback: Just use local projects
      setProjects(localProjects);
    } catch (error) {
      console.error('[Projects] Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh projects
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProjects();
    setIsRefreshing(false);
    toast.success('Projects refreshed');
  };

  // Save current project before loading new one
  useEffect(() => {
    // Auto-save current project if exists
    if (brand && product && projectId) {
      saveCurrentProject();
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [user]);

  // Filter projects based on search
  const filteredProjects = projects.filter(project => 
    project.brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.product.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Resume project
  const handleResumeProject = (project: ProjectData) => {
    // Save current project first
    if (brand && product && projectId && projectId !== project.id) {
      saveCurrentProject();
    }

    // Load the selected project
    const success = loadProject(project.id);
    
    if (success) {
      toast.success(`Resuming "${project.brand.name}" project`);
      navigate(`/step${project.currentStep}`);
    } else {
      toast.error('Failed to load project');
    }
  };

  // Delete project from localStorage
  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    
    try {
      const allProjects = getAllProjects();
      const filtered = allProjects.filter(p => p.id !== projectId);
      localStorage.setItem('weaveProjects', JSON.stringify(filtered));
      setProjects(filtered);
      toast.success('Project deleted');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  // Start new project
  const handleNewProject = () => {
    createNewProject();
    toast.success('Starting new project');
    navigate('/step1');
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Get step label
  const getStepLabel = (step: number) => {
    const labels: Record<number, string> = {
      1: 'Brand Setup',
      2: 'Creative Brief',
      3: 'Generation',
      4: 'Customization',
      5: 'Export',
    };
    return labels[step] || 'Unknown';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      className="min-h-[60vh] bg-background noise-overlay py-8 px-4 sm:px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-primary" />
                My Projects
              </h1>
              <p className="text-muted-foreground mt-2">
                {projects.length} project{projects.length !== 1 ? 's' : ''} • Manage and resume your creative work
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="hero" 
                onClick={handleNewProject}
                className="glow-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects by brand or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Projects Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery ? 'No matching projects' : 'No projects yet'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? 'Try adjusting your search query' 
                : 'Start your first project to see it here'}
            </p>
            {!searchQuery && (
              <Button variant="hero" onClick={handleNewProject}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Project
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" 
              : "space-y-4"
            }
          >
            {filteredProjects.map((project) => (
              <motion.div key={project.id} variants={itemVariants}>
                <Card 
                  className={`group glass overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/50 ${
                    viewMode === "list" ? "p-4" : ""
                  }`}
                  onClick={() => handleResumeProject(project)}
                >
                  {viewMode === "grid" ? (
                    <>
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-secondary/50 overflow-hidden">
                        {project.generatedImage || project.finalVisualUrl ? (
                          <img 
                            src={project.finalVisualUrl || project.generatedImage} 
                            alt={project.brand.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center"
                            style={{ 
                              background: `linear-gradient(135deg, ${project.brand.colors.primary}40, ${project.brand.colors.secondary}40)` 
                            }}
                          >
                            <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                          </div>
                        )}
                        
                        {/* Step Badge */}
                        <Badge 
                          className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white border-0"
                        >
                          Step {project.currentStep}/5
                        </Badge>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm hover:bg-red-500/80 text-white w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteProject(e, project.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                              style={{ 
                                background: `linear-gradient(135deg, ${project.brand.colors.primary}, ${project.brand.colors.secondary})` 
                              }}
                            >
                              {project.brand.name.substring(0, 1)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-foreground truncate">
                                {project.brand.name}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">
                                {project.product.type}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(project.updatedAt)}
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {getStepLabel(project.currentStep)}
                          </Badge>
                        </div>
                        
                        {/* Resume Button */}
                        <Button 
                          className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                          variant="outline"
                          size="sm"
                        >
                          Resume Project
                          <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    /* List View */
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div 
                        className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                        style={{ 
                          background: (project.generatedImage || project.finalVisualUrl)
                            ? undefined 
                            : `linear-gradient(135deg, ${project.brand.colors.primary}40, ${project.brand.colors.secondary}40)` 
                        }}
                      >
                        {project.generatedImage || project.finalVisualUrl ? (
                          <img 
                            src={project.finalVisualUrl || project.generatedImage} 
                            alt={project.brand.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ 
                              background: `linear-gradient(135deg, ${project.brand.colors.primary}, ${project.brand.colors.secondary})` 
                            }}
                          >
                            {project.brand.name.substring(0, 1)}
                          </div>
                          <h3 className="font-semibold text-foreground truncate">
                            {project.brand.name}
                          </h3>
                          <Badge variant="outline" className="ml-auto text-[10px]">
                            Step {project.currentStep}/5
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{project.product.type}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(project.updatedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="hover:bg-red-500/10 hover:text-red-500"
                          onClick={(e) => handleDeleteProject(e, project.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          Resume
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Projects;
