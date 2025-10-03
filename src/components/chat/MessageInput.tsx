import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MessageInputProps {
  onSend: (content: string, attachment?: File) => void;
  replyingTo?: any;
  onCancelReply?: () => void;
  editingMessage?: any;
  onCancelEdit?: () => void;
}

const EMOJI_LIST = ["😀", "😂", "❤️", "👍", "👎", "🎉", "🔥", "💯", "✅", "❌"];

export const MessageInput = ({
  onSend,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit
}: MessageInputProps) => {
  const [message, setMessage] = useState(editingMessage?.content || "");
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !attachment) return;

    onSend(message, attachment || undefined);
    setMessage("");
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setAttachment(file);
    }
  };

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t bg-card">
      {/* Reply/Edit Banner */}
      {(replyingTo || editingMessage) && (
        <div className="px-4 pt-3 pb-2 border-b bg-accent/50 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground">
              {replyingTo ? "Replying to" : "Editing message"}
            </p>
            <p className="text-sm truncate">
              {(replyingTo || editingMessage)?.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={replyingTo ? onCancelReply : onCancelEdit}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Attachment Preview */}
      {attachment && (
        <div className="px-4 pt-3 pb-2 border-b flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 text-sm">
            <Paperclip className="h-4 w-4" />
            <span className="truncate">{attachment.name}</span>
            <span className="text-muted-foreground text-xs">
              ({(attachment.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setAttachment(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,video/*,application/pdf,.doc,.docx"
            />
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="grid grid-cols-5 gap-2">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="text-2xl hover:bg-accent rounded p-1 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Textarea
              ref={textareaRef}
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 min-h-10 max-h-32 resize-none"
              rows={1}
            />
          </div>

          <Button
            type="submit"
            className="gradient-primary"
            disabled={!message.trim() && !attachment}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
