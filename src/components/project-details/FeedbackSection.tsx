import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/database-config";

interface FeedbackSectionProps {
  projectId: string;
  versions: any[];
  userRole: string | null;
}

export const FeedbackSection = ({ projectId, versions, userRole }: FeedbackSectionProps) => {
  const [selectedVersion, setSelectedVersion] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!selectedVersion) {
      toast.error("Please select a version");
      return;
    }

    if (!feedbackText.trim()) {
      toast.error("Please enter feedback");
      return;
    }

    setSubmitting(true);

    try {
      await db.query({
        collection: 'video_versions',
        operation: 'update',
        where: { id: selectedVersion },
        data: {
          correction_notes: feedbackText,
          updated_at: new Date().toISOString()
        }
      });

      toast.success("Feedback submitted successfully");
      setFeedbackText("");
      setSelectedVersion("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const getVersionFeedback = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    return version?.correction_notes || null;
  };

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Feedback & Corrections
        </CardTitle>
        <CardDescription>Request changes or provide feedback on video versions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Submit Feedback */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="version-select">Select Version</Label>
            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a version to review" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    Version {version.version_number} - {new Date(version.created_at).toLocaleDateString()}
                    {version.is_approved && " (Approved)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedVersion && (
            <>
              <div className="space-y-2">
                <Label htmlFor="feedback">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Describe the changes you'd like to see in this version..."
                  rows={6}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about timestamps, scenes, or elements that need changes
                </p>
              </div>

              <Button
                onClick={handleSubmitFeedback}
                disabled={submitting}
                className="w-full gradient-primary"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </>
          )}
        </div>

        {/* Feedback History */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Feedback History</h3>
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No versions available for feedback</p>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                version.correction_notes && (
                  <div key={version.id} className="p-4 bg-card border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">Version {version.version_number}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(version.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{version.correction_notes}</p>
                  </div>
                )
              ))}
              {!versions.some(v => v.correction_notes) && (
                <p className="text-sm text-muted-foreground">No feedback submitted yet</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
