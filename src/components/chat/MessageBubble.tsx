import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical, Reply, Edit2, Trash2, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface MessageBubbleProps {
  message: any;
  isOwnMessage: boolean;
  onReply?: (message: any) => void;
  onEdit?: (message: any) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

export const MessageBubble = ({
  message,
  isOwnMessage,
  onReply,
  onEdit,
  onDelete,
  onReact
}: MessageBubbleProps) => {
  const [showActions, setShowActions] = useState(false);

  const reactions = message.reactions || {};
  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="max-w-[70%] flex flex-col gap-1">
        {/* Reply Reference */}
        {message.reply_to_message_id && (
          <div className={`text-xs px-3 py-1 rounded-t-lg border-l-2 ${
            isOwnMessage ? "bg-primary/10 border-primary" : "bg-muted border-muted-foreground"
          }`}>
            <p className="text-muted-foreground">Replying to message</p>
          </div>
        )}

        {/* Message Content */}
        <div className={`relative rounded-2xl px-4 py-2 ${
          isOwnMessage ? "gradient-primary text-primary-foreground" : "bg-muted"
        }`}>
          {/* Actions Menu */}
          {showActions && (
            <div className={`absolute -top-8 ${isOwnMessage ? "right-0" : "left-0"} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7"
                onClick={() => onReact?.(message.id, "👍")}
              >
                👍
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7"
                onClick={() => onReact?.(message.id, "❤️")}
              >
                ❤️
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7"
                onClick={() => onReply?.(message)}
              >
                <Reply className="h-3 w-3" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                  {isOwnMessage && (
                    <>
                      <DropdownMenuItem onClick={() => onEdit?.(message)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(message.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                  {message.attachment_url && (
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* File Attachment Preview */}
          {message.attachment_url && (
            <div className="mb-2">
              {message.attachment_type?.startsWith("image/") ? (
                <img
                  src={message.attachment_url}
                  alt="Attachment"
                  className="rounded-lg max-w-full h-auto max-h-64 object-contain"
                />
              ) : (
                <div className="flex items-center gap-2 p-2 bg-background/10 rounded-lg">
                  <Download className="h-4 w-4" />
                  <span className="text-sm">File attachment</span>
                </div>
              )}
            </div>
          )}

          {/* Message Text */}
          <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>

          {/* Timestamp & Status */}
          <div className="flex items-center gap-2 mt-1">
            <p className={`text-xs ${
              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
            }`}>
              {format(new Date(message.created_at), "HH:mm")}
            </p>
            {message.edited && (
              <span className={`text-xs ${
                isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}>
                (edited)
              </span>
            )}
            {isOwnMessage && message.is_read && (
              <span className="text-xs">✓✓</span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {hasReactions && (
          <div className={`flex gap-1 px-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
            {Object.entries(reactions).map(([emoji, users]: [string, any]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(message.id, emoji)}
                className="flex items-center gap-1 px-2 py-0.5 bg-accent rounded-full text-xs hover:bg-accent/80 transition-colors"
              >
                <span>{emoji}</span>
                {users.length > 1 && <span>{users.length}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
