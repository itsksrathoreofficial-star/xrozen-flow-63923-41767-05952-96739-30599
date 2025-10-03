import { useState } from "react";
import { Clock, Edit, Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Project {
  id: string;
  name: string;
  description?: string;
  project_type?: string;
  status: string;
  fee?: number;
  assigned_date?: string;
  deadline?: string;
  created_at: string;
  is_subproject?: boolean;
  parent_project_id?: string;
}

interface ProjectsTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onAddSubProject: (parentId: string) => void;
  onProjectClick: (projectId: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
}

export const ProjectsTable = ({ 
  projects, 
  onEdit, 
  onDelete, 
  onAddSubProject,
  onProjectClick,
  sortConfig,
  onSort 
}: ProjectsTableProps) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const toggleExpand = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: "secondary", label: "Draft" },
      in_review: { variant: "default", label: "In Review" },
      approved: { variant: "default", label: "Approved", className: "bg-success" },
      completed: { variant: "default", label: "Completed", className: "bg-success" }
    };
    
    const config = variants[status] || variants.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const mainProjects = projects.filter(p => !p.is_subproject);
  
  const renderProjectRow = (project: Project, isSubProject = false) => {
    const subProjects = projects.filter(p => p.parent_project_id === project.id);
    const hasSubProjects = subProjects.length > 0;
    const isExpanded = expandedProjects.has(project.id);

    return (
      <>
        <TableRow 
          key={project.id} 
          className={isSubProject ? "bg-muted/30" : "hover:bg-muted/50 cursor-pointer"}
          onClick={() => !isSubProject && onProjectClick(project.id)}
        >
          <TableCell onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              {!isSubProject && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleExpand(project.id)}
                  disabled={!hasSubProjects}
                >
                  {hasSubProjects && (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                </Button>
              )}
              <span className={isSubProject ? "ml-8 text-sm" : "font-medium"}>
                {project.name}
              </span>
            </div>
          </TableCell>
          <TableCell>{project.project_type || "—"}</TableCell>
          <TableCell>{getStatusBadge(project.status)}</TableCell>
          <TableCell>
            {project.fee ? `₹${project.fee.toLocaleString()}` : "—"}
          </TableCell>
          <TableCell>
            {project.assigned_date ? new Date(project.assigned_date).toLocaleDateString() : "—"}
          </TableCell>
          <TableCell>
            {project.deadline ? new Date(project.deadline).toLocaleDateString() : "—"}
          </TableCell>
          <TableCell onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              {!isSubProject && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddSubProject(project.id)}
                  title="Add Sub-project"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(project)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{project.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete(project.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TableCell>
        </TableRow>
        {isExpanded && subProjects.map(subProject => renderProjectRow(subProject, true))}
      </>
    );
  };

  return (
    <div className="rounded-lg border bg-card shadow-elegant overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('name')}
            >
              Project Name {getSortIcon('name')}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('project_type')}
            >
              Type {getSortIcon('project_type')}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('status')}
            >
              Status {getSortIcon('status')}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('fee')}
            >
              Fee {getSortIcon('fee')}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('assigned_date')}
            >
              Assigned {getSortIcon('assigned_date')}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('deadline')}
            >
              Deadline {getSortIcon('deadline')}
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mainProjects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No projects found. Create your first project to get started.
              </TableCell>
            </TableRow>
          ) : (
            mainProjects.map(project => renderProjectRow(project))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
