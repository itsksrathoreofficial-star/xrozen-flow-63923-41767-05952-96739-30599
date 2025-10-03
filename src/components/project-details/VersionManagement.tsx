import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Eye, Link as LinkIcon, Play } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/database-config";
import { supabase } from "@/integrations/supabase/client";

interface VersionManagementProps {
  projectId: string;
  versions: any[];
  onVersionsUpdate: () => void;
  userRole: string | null;
  isProjectCreator?: boolean;
}

export const VersionManagement = ({ projectId, versions, onVersionsUpdate, userRole, isProjectCreator = false }: VersionManagementProps) => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<any>(null);
  const [formData, setFormData] = useState({
    preview_url: "",
    final_url: ""
  });
  
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedVersionForFeedback, setSelectedVersionForFeedback] = useState<any>(null);
  
  const [viewFeedbackDialogOpen, setViewFeedbackDialogOpen] = useState(false);
  const [viewingFeedback, setViewingFeedback] = useState<any>(null);
  
  const [finalLinkDialogOpen, setFinalLinkDialogOpen] = useState(false);
  const [finalLinkInput, setFinalLinkInput] = useState("");
  const [selectedVersionForFinalLink, setSelectedVersionForFinalLink] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.preview_url.trim()) {
      toast.error("Preview URL is required");
      return;
    }

    if (!isValidUrl(formData.preview_url)) {
      toast.error("Please enter a valid preview URL");
      return;
    }

    if (formData.final_url && !isValidUrl(formData.final_url)) {
      toast.error("Please enter a valid final URL");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingVersion) {
        await db.query({
          collection: 'video_versions',
          operation: 'update',
          where: { id: editingVersion.id },
          data: {
            preview_url: formData.preview_url,
            final_url: formData.final_url || null
          }
        });
        toast.success("Version updated successfully");
      } else {
        const nextVersionNumber = versions.length > 0 
          ? Math.max(...versions.map(v => v.version_number)) + 1 
          : 1;

        await db.query({
          collection: 'video_versions',
          operation: 'insert',
          data: {
            project_id: projectId,
            version_number: nextVersionNumber,
            preview_url: formData.preview_url,
            final_url: formData.final_url || null,
            uploaded_by: user.id,
            approval_status: 'pending'
          }
        });
        toast.success("Version added successfully");
      }

      handleDialogClose();
      onVersionsUpdate();
    } catch (error: any) {
      console.error("Error saving version:", error);
      toast.error(error.message || "Failed to save version");
    }
  };

  const handleEdit = (version: any) => {
    setEditingVersion(version);
    setFormData({
      preview_url: version.preview_url || "",
      final_url: version.final_url || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (versionId: string) => {
    try {
      await db.query({
        collection: 'video_versions',
        operation: 'delete',
        where: { id: versionId }
      });
      toast.success("Version deleted successfully");
      onVersionsUpdate();
    } catch (error) {
      console.error("Error deleting version:", error);
      toast.error("Failed to delete version");
    }
  };

  const handleApprovalAction = async (versionId: string, status: 'approved' | 'rejected' | 'corrections_needed') => {
    if (status === 'corrections_needed') {
      const version = versions.find(v => v.id === versionId);
      setSelectedVersionForFeedback(version);
      setFeedbackText(version?.correction_notes || "");
      setFeedbackDialogOpen(true);
      return;
    }

    if (status === 'approved') {
      try {
        await db.query({
          collection: 'video_versions',
          operation: 'update',
          where: { id: versionId },
          data: { 
            approval_status: status,
            is_approved: true,
            final_link_requested: true
          }
        });
        toast.success("Version approved! Editor can now add final link.");
        onVersionsUpdate();
      } catch (error) {
        console.error("Error updating approval status:", error);
        toast.error("Failed to update approval status");
      }
      return;
    }

    try {
      await db.query({
        collection: 'video_versions',
        operation: 'update',
        where: { id: versionId },
        data: { 
          approval_status: status,
          is_approved: false
        }
      });
      toast.success(`Version ${status}`);
      onVersionsUpdate();
    } catch (error) {
      console.error("Error updating approval status:", error);
      toast.error("Failed to update approval status");
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast.error("Please enter feedback");
      return;
    }

    try {
      await db.query({
        collection: 'video_versions',
        operation: 'update',
        where: { id: selectedVersionForFeedback.id },
        data: {
          approval_status: 'corrections_needed',
          correction_notes: feedbackText,
          is_approved: false
        }
      });
      toast.success("Feedback submitted successfully");
      setFeedbackDialogOpen(false);
      setFeedbackText("");
      setSelectedVersionForFeedback(null);
      onVersionsUpdate();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    }
  };

  const handleViewFeedback = (version: any) => {
    setViewingFeedback(version);
    setViewFeedbackDialogOpen(true);
  };

  const handleOpenFinalLinkDialog = (version: any) => {
    setSelectedVersionForFinalLink(version);
    setFinalLinkInput(version.final_url || "");
    setFinalLinkDialogOpen(true);
  };

  const handleSubmitFinalLink = async () => {
    if (!finalLinkInput.trim()) {
      toast.error("Please enter final link");
      return;
    }

    if (!isValidUrl(finalLinkInput)) {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      await db.query({
        collection: 'video_versions',
        operation: 'update',
        where: { id: selectedVersionForFinalLink.id },
        data: {
          final_url: finalLinkInput,
          final_link_requested: false
        }
      });
      toast.success("Final link added successfully");
      setFinalLinkDialogOpen(false);
      setFinalLinkInput("");
      setSelectedVersionForFinalLink(null);
      onVersionsUpdate();
    } catch (error) {
      console.error("Error adding final link:", error);
      toast.error("Failed to add final link");
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingVersion(null);
    setFormData({ preview_url: "", final_url: "" });
  };

  const getApprovalBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", label: "Pending", icon: AlertCircle },
      approved: { variant: "default", label: "Approved", icon: CheckCircle, className: "bg-success" },
      rejected: { variant: "destructive", label: "Rejected", icon: XCircle },
      corrections_needed: { variant: "default", label: "Corrections Needed", icon: AlertCircle, className: "bg-warning" }
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      <Card className="shadow-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Video Versions</CardTitle>
              <CardDescription>Manage different versions of the project video</CardDescription>
            </div>
            {(userRole === 'editor' || isProjectCreator) && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Version
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No versions added yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Preview Link</TableHead>
                  <TableHead>Final Link</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell className="font-medium">v{version.version_number}</TableCell>
                    <TableCell>{new Date(version.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {version.preview_url ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => navigate(`/video-preview/${version.id}`)}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Watch & Review
                          </Button>
                          <a 
                            href={version.preview_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-xs flex items-center"
                          >
                            Open Direct Link
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not added</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {version.final_url ? (
                        <a 
                          href={version.final_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-semibold bg-success/10 px-2 py-1 rounded"
                        >
                          View Final Link
                        </a>
                      ) : version.final_link_requested && (userRole === 'editor' || isProjectCreator) ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleOpenFinalLinkDialog(version)}
                        >
                          <LinkIcon className="w-3 h-3 mr-1" />
                          Add Final Link
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">Not added</span>
                      )}
                    </TableCell>
                    <TableCell>{getApprovalBadge(version.approval_status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {userRole === 'client' && version.approval_status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleApprovalAction(version.id, 'approved')}
                              className="bg-success hover:bg-success/90"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleApprovalAction(version.id, 'rejected')}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleApprovalAction(version.id, 'corrections_needed')}
                            >
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Corrections Needed
                            </Button>
                          </>
                        )}
                        
                        {version.correction_notes && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewFeedback(version)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Feedback
                          </Button>
                        )}

                        {(userRole === 'editor' || isProjectCreator) && version.approval_status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEdit(version)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDelete(version.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Version Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVersion ? "Edit Version" : "Add New Version"}</DialogTitle>
            <DialogDescription>
              {editingVersion ? "Update the version details" : "Add a new video version"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="preview_url">Preview URL *</Label>
                <Input
                  id="preview_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.preview_url}
                  onChange={(e) => setFormData({ ...formData, preview_url: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="final_url">Final URL (Optional)</Label>
                <Input
                  id="final_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.final_url}
                  onChange={(e) => setFormData({ ...formData, final_url: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                Cancel
              </Button>
              <Button type="submit">
                {editingVersion ? "Update" : "Add"} Version
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Corrections Feedback</DialogTitle>
            <DialogDescription>
              Provide detailed feedback about what needs to be corrected in Version {selectedVersionForFeedback?.version_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your detailed feedback here... You can use formatting and be as descriptive as needed."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={10}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFeedback}>
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Feedback Dialog */}
      <Dialog open={viewFeedbackDialogOpen} onOpenChange={setViewFeedbackDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback for Version {viewingFeedback?.version_number}</DialogTitle>
            <DialogDescription>
              Client corrections and feedback
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap">
              {viewingFeedback?.correction_notes || "No feedback available"}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewFeedbackDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Link Dialog */}
      <Dialog open={finalLinkDialogOpen} onOpenChange={setFinalLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Final Link</DialogTitle>
            <DialogDescription>
              Add the final approved video link for Version {selectedVersionForFinalLink?.version_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="final_link">Final Video URL *</Label>
              <Input
                id="final_link"
                type="url"
                placeholder="https://..."
                value={finalLinkInput}
                onChange={(e) => setFinalLinkInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFinalLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFinalLink}>
              Add Final Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
