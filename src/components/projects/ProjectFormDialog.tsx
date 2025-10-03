import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/database-config";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

interface ProjectFormData {
  name: string;
  description: string;
  project_type: string;
  editor_id: string;
  client_id: string;
  fee: string;
  assigned_date: string;
  deadline: string;
  raw_footage_link: string;
  status: string;
}

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProject: any;
  onSubmit: (data: any) => void;
  editors: any[];
  clients: any[];
  parentProjectId?: string;
}

export const ProjectFormDialog = ({
  open,
  onOpenChange,
  editingProject,
  onSubmit,
  editors,
  clients,
  parentProjectId
}: ProjectFormDialogProps) => {
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [showAddType, setShowAddType] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    project_type: "",
    editor_id: "",
    client_id: "",
    fee: "",
    assigned_date: "",
    deadline: "",
    raw_footage_link: "",
    status: "draft"
  });

  useEffect(() => {
    loadProjectTypes();
  }, []);

  useEffect(() => {
    if (editingProject) {
      setFormData({
        name: editingProject.name || "",
        description: editingProject.description || "",
        project_type: editingProject.project_type || "",
        editor_id: editingProject.editor_id || "",
        client_id: editingProject.client_id || "",
        fee: editingProject.fee?.toString() || "",
        assigned_date: editingProject.assigned_date || "",
        deadline: editingProject.deadline || "",
        raw_footage_link: editingProject.raw_footage_link || "",
        status: editingProject.status || "draft"
      });
    } else {
      setFormData({
        name: "",
        description: "",
        project_type: "",
        editor_id: "",
        client_id: "",
        fee: "",
        assigned_date: "",
        deadline: "",
        raw_footage_link: "",
        status: "draft"
      });
    }
  }, [editingProject, open]);

  const loadProjectTypes = async () => {
    try {
      const types = await db.query({
        collection: 'project_types',
        operation: 'select',
        orderBy: { column: 'created_at', ascending: true }
      }) as any[];
      setProjectTypes(types || []);
    } catch (error) {
      console.error("Error loading project types:", error);
    }
  };

  const handleAddProjectType = async () => {
    if (!newTypeName.trim()) {
      toast.error("Please enter a type name");
      return;
    }

    const exists = projectTypes.some(t => t.name.toLowerCase() === newTypeName.toLowerCase());
    if (exists) {
      toast.error("This type already exists");
      return;
    }

    try {
      await db.query({
        collection: 'project_types',
        operation: 'insert',
        data: { name: newTypeName.trim() }
      });
      
      toast.success("Project type added successfully");
      setNewTypeName("");
      setShowAddType(false);
      loadProjectTypes();
    } catch (error) {
      toast.error("Failed to add project type");
    }
  };

  const handleRemoveProjectType = async (typeId: string) => {
    try {
      await db.query({
        collection: 'project_types',
        operation: 'delete',
        where: { id: typeId }
      });
      
      toast.success("Project type removed");
      loadProjectTypes();
    } catch (error) {
      toast.error("Failed to remove project type");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (formData.raw_footage_link && !isValidUrl(formData.raw_footage_link)) {
      toast.error("Please enter a valid URL for raw footage link");
      return;
    }

    if (formData.deadline && formData.assigned_date) {
      if (new Date(formData.deadline) < new Date(formData.assigned_date)) {
        toast.error("Deadline cannot be before assigned date");
        return;
      }
    }

    const selectedEditor = editors.find(e => e.id === formData.editor_id);
    const isFreelance = selectedEditor?.employment_type === 'freelance';

    const submitData = {
      ...formData,
      fee: (isFreelance && formData.fee) ? parseFloat(formData.fee) : null,
      editor_id: formData.editor_id || null,
      client_id: formData.client_id || null,
      assigned_date: formData.assigned_date || null,
      deadline: formData.deadline || null,
      raw_footage_link: formData.raw_footage_link || null,
      project_type: formData.project_type || null,
      is_subproject: !!parentProjectId,
      parent_project_id: parentProjectId || null
    };

    onSubmit(submitData);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProject ? "Edit Project" : parentProjectId ? "Add Sub-Project" : "Create New Project"}
          </DialogTitle>
          <DialogDescription>
            {editingProject ? "Update project details" : "Add a new project to your workflow"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="Summer Campaign 2025"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_type">Project Type</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.project_type}
                  onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        <div className="flex items-center justify-between w-full">
                          <span>{type.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveProjectType(type.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddType(!showAddType)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {showAddType && (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="New type name"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProjectType())}
                  />
                  <Button type="button" size="sm" onClick={handleAddProjectType}>
                    Add
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the project..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editor">Editor</Label>
              <Select
                value={formData.editor_id}
                onValueChange={(value) => setFormData({ ...formData, editor_id: value, fee: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select editor" />
                </SelectTrigger>
                <SelectContent>
                  {editors.map((editor) => (
                    <SelectItem key={editor.id} value={editor.id}>
                      {editor.full_name} ({editor.employment_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name} {client.company ? `(${client.company})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.editor_id && editors.find(e => e.id === formData.editor_id)?.employment_type === 'freelance' && (
            <div className="space-y-2">
              <Label htmlFor="fee">Project Fee (₹)</Label>
              <Input
                id="fee"
                type="number"
                step="0.01"
                placeholder="Enter project fee"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigned_date">Assigned Date</Label>
              <Input
                id="assigned_date"
                type="date"
                value={formData.assigned_date}
                onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="raw_footage_link">Raw Footage Link</Label>
            <Input
              id="raw_footage_link"
              type="url"
              placeholder="https://drive.google.com/..."
              value={formData.raw_footage_link}
              onChange={(e) => setFormData({ ...formData, raw_footage_link: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full gradient-primary">
            {editingProject ? "Update Project" : "Create Project"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
