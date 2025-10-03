import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { MoreVertical, Search, Phone, Video } from "lucide-react";
import { db } from "@/lib/database-config";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatWindowProps {
  projectId: string;
  projectName: string;
  currentUserId: string;
}

export const ChatWindow = ({ projectId, projectName, currentUserId }: ChatWindowProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();

    // Subscribe to new messages for this project
    const channel = supabase
      .channel(`messages-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `project_id=eq.${projectId}`
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const messagesData = await db.query({
        collection: "messages",
        operation: "select",
        where: { project_id: projectId },
        orderBy: { column: "created_at", ascending: true }
      }) as any[];

      setMessages(messagesData || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string, attachment?: File) => {
    try {
      let attachmentUrl = null;
      let attachmentType = null;

      // TODO: Implement file upload to storage
      // if (attachment) {
      //   const uploadResult = await uploadFile(attachment);
      //   attachmentUrl = uploadResult.url;
      //   attachmentType = attachment.type;
      // }

      if (editingMessage) {
        // Update existing message
        await db.query({
          collection: "messages",
          operation: "update",
          where: { id: editingMessage.id },
          data: {
            content,
            edited: true
          }
        });
        setEditingMessage(null);
      } else {
        // Create new message
        await db.query({
          collection: "messages",
          operation: "insert",
          data: {
            project_id: projectId,
            sender_id: currentUserId,
            content,
            reply_to_message_id: replyingTo?.id || null,
            attachment_url: attachmentUrl,
            attachment_type: attachmentType,
            is_read: false
          }
        });
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      await db.query({
        collection: "messages",
        operation: "delete",
        where: { id: messageToDelete }
      });
      toast.success("Message deleted");
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
    } finally {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const reactions = message.reactions || {};
      const userReactions = reactions[emoji] || [];

      // Toggle reaction
      const updatedReactions = userReactions.includes(currentUserId)
        ? userReactions.filter((id: string) => id !== currentUserId)
        : [...userReactions, currentUserId];

      if (updatedReactions.length === 0) {
        delete reactions[emoji];
      } else {
        reactions[emoji] = updatedReactions;
      }

      await db.query({
        collection: "messages",
        operation: "update",
        where: { id: messageId },
        data: { reactions }
      });
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{projectName}</h2>
          <p className="text-xs text-muted-foreground">Project Chat</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View project details</DropdownMenuItem>
              <DropdownMenuItem>Manage participants</DropdownMenuItem>
              <DropdownMenuItem>Clear chat history</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.sender_id === currentUserId}
                onReply={setReplyingTo}
                onEdit={setEditingMessage}
                onDelete={(id) => {
                  setMessageToDelete(id);
                  setDeleteDialogOpen(true);
                }}
                onReact={handleReact}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
