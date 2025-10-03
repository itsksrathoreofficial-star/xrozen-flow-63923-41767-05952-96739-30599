import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock, CheckCircle, XCircle, Send, Timer } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FeedbackCommentsProps {
  feedback: any[];
  currentTime: number;
  onAddFeedback: (comment: string, timestamp?: number) => void;
  onSeekToTimestamp: (seconds: number) => void;
  onResolveFeedback: (feedbackId: string, resolved: boolean) => void;
  playerRef?: React.RefObject<any>;
}

export const FeedbackComments = ({
  feedback,
  currentTime,
  onAddFeedback,
  onSeekToTimestamp,
  onResolveFeedback,
  playerRef
}: FeedbackCommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [timestampText, setTimestampText] = useState("");

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getRealCurrentTime = () => {
    // Try to get time from video player first
    if (playerRef?.current?.getCurrentTime) {
      const playerTime = playerRef.current.getCurrentTime();
      if (playerTime > 0) {
        return playerTime;
      }
    }
    
    // Fallback to direct video element access
    const videoElement = document.querySelector('video');
    if (videoElement && videoElement.currentTime > 0) {
      return videoElement.currentTime;
    }
    
    // For YouTube videos, try to extract time from iframe
    const youtubeIframe = document.querySelector('iframe[src*="youtube.com"]') as HTMLIFrameElement;
    if (youtubeIframe && youtubeIframe.contentWindow) {
      try {
        youtubeIframe.contentWindow.postMessage(JSON.stringify({ 
          event: 'command', 
          func: 'getCurrentTime' 
        }), '*');
      } catch (e) {
        // Silent error handling
      }
    }
    
    // For Google Drive videos, try to extract time from iframe
    const googleDriveIframe = document.querySelector('iframe[src*="drive.google.com"]') as HTMLIFrameElement;
    if (googleDriveIframe) {
      // Google Drive doesn't support time tracking via iframe API
      // We'll rely on manual input for Google Drive
      return 0; // Force manual input for Google Drive
    }
    
    // Last fallback to passed currentTime
    return currentTime;
  };

  const parseTime = (text: string) => {
    const parts = text.split(":").map((p) => p.trim());
    
    // Handle h:mm:ss format (hour:minute:second)
    if (parts.length === 3) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const s = parseInt(parts[2], 10);
      return (isNaN(h) || isNaN(m) || isNaN(s)) ? 0 : h * 3600 + m * 60 + s;
    }
    
    // Handle mm:ss format (minute:second)
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10);
      const s = parseInt(parts[1], 10);
      return (isNaN(m) || isNaN(s)) ? 0 : m * 60 + s;
    }
    
    // Handle single number (seconds)
    const v = parseInt(text, 10);
    return isNaN(v) ? 0 : v;
  };

  useEffect(() => {
    if (useCurrentTime) {
      const realTime = getRealCurrentTime();
      const formattedTime = formatTime(realTime);
      setTimestampText(formattedTime);
    } else if (!timestampText) {
      setTimestampText("0:00");
    }
  }, [currentTime, useCurrentTime, timestampText]);

  const handleInsertTimestamp = () => {
    const realTime = getRealCurrentTime();
    const timestamp = useCurrentTime ? formatTime(realTime) : timestampText;
    setNewComment((prev) => {
      if (prev.trim()) {
        return `${prev} [${timestamp}] `;
      }
      return `[${timestamp}] `;
    });
  };

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    const realTime = getRealCurrentTime();
    const selectedTs = useCurrentTime ? realTime : parseTime(timestampText);
    onAddFeedback(newComment, selectedTs);
    setNewComment("");
  };

  return (
    <Card className="shadow-elegant h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Feedback & Comments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Add Feedback</label>
            {useCurrentTime && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(getRealCurrentTime())}
              </Badge>
            )}
          </div>
          
          <Textarea
            placeholder="Type your feedback here..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[120px] resize-none"
          />

          {/* Prominent Add Timestamp Button */}
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                      handleInsertTimestamp();
                    }}
                    variant="outline"
                    className="w-full border-primary/50 hover:bg-primary/10"
                    size="lg"
                  >
                    <Timer className="w-5 h-5 mr-2" />
                    Add Timestamp {useCurrentTime ? `[${formatTime(getRealCurrentTime())}]` : `[${timestampText}]`}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {useCurrentTime 
                      ? "Click to insert current video timestamp into your feedback" 
                      : "Manual timestamp mode: Pause the video and click to add timestamp"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
          </div>
          
          {/* Timestamp Controls */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useCurrentTime}
                onChange={(e) => {
                  setUseCurrentTime(e.target.checked);
                  if (e.target.checked) setTimestampText(formatTime(currentTime));
                }}
                className="rounded border-gray-300"
              />
              <label className="text-sm">Auto-track video time</label>
            </div>
            
            {useCurrentTime && (
              <p className="text-xs text-muted-foreground">
                Auto tracking only works on YouTube videos
              </p>
            )}
            
            {!useCurrentTime && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={timestampText}
                    onChange={(e) => setTimestampText(e.target.value)}
                    placeholder="mm:ss or h:mm:ss"
                    className="h-8 w-32"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const videoElement = document.querySelector('video');
                      if (videoElement && videoElement.currentTime > 0) {
                        const time = videoElement.currentTime;
                        setTimestampText(formatTime(time));
                      } else if (playerRef?.current?.getCurrentTime) {
                        const playerTime = playerRef.current.getCurrentTime();
                        if (playerTime > 0) {
                          setTimestampText(formatTime(playerTime));
                        }
                      }
                    }}
                    className="h-8 px-2 text-xs"
                  >
                    Get Time
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter time manually (e.g., 1:23 or 1:23:45)
                </p>
              </div>
            )}
          </div>


          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={!newComment.trim()}
            size="lg"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Feedback
          </Button>
        </div>

        <Separator />

        {/* Feedback List */}
        <div>
          <h4 className="text-sm font-medium mb-3">
            All Feedback ({feedback.length})
          </h4>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {feedback.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No feedback yet. Be the first to add!
                </p>
              ) : (
                feedback.map((item) => (
                  <Card
                    key={item.id}
                    className={`${
                      item.is_resolved
                        ? "border-success/30 bg-success/5"
                        : "border-border"
                    }`}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        {item.timestamp_seconds !== null && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSeekToTimestamp(item.timestamp_seconds)}
                            className="px-2 h-6 text-xs"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(item.timestamp_seconds)}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onResolveFeedback(item.id, !item.is_resolved)
                          }
                          className="px-2 h-6"
                        >
                          {item.is_resolved ? (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-success" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm">{item.comment_text}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                        {item.is_resolved && (
                          <Badge variant="outline" className="text-xs bg-success/10">
                            Resolved
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
