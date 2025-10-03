import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Pin } from "lucide-react";
import { db } from "@/lib/database-config";
import { format } from "date-fns";

interface ChatListProps {
  currentUserId: string;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
}

interface ProjectChat {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  pinned: boolean;
}

export const ChatList = ({ currentUserId, selectedProjectId, onSelectProject }: ChatListProps) => {
  const [chats, setChats] = useState<ProjectChat[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, [currentUserId]);

  const loadChats = async () => {
    try {
      // Load all projects where user is creator or client
      const projects = await db.query({
        collection: "projects",
        operation: "select",
        where: { creator_id: currentUserId },
        orderBy: { column: "updated_at", ascending: false }
      }) as any[];

      // Get last message for each project
      const chatsWithMessages = await Promise.all(
        projects.map(async (project) => {
          const messages = await db.query({
            collection: "messages",
            operation: "select",
            where: { project_id: project.id },
            orderBy: { column: "created_at", ascending: false },
            limit: 1
          }) as any[];

          const lastMessage = messages[0];

          return {
            id: project.id,
            name: project.name,
            lastMessage: lastMessage?.content || "No messages yet",
            lastMessageTime: lastMessage?.created_at || project.created_at,
            unreadCount: 0, // TODO: Implement unread count
            pinned: false // TODO: Implement pinning
          };
        })
      );

      setChats(chatsWithMessages);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedChats = filteredChats.filter(c => c.pinned);
  const regularChats = filteredChats.filter(c => !c.pinned);

  return (
    <div className="w-80 border-r flex flex-col bg-card h-full">
      {/* Search Bar */}
      <div className="p-4 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {pinnedChats.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Pin className="h-3 w-3" />
                PINNED
              </div>
              {pinnedChats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isSelected={chat.id === selectedProjectId}
                  onClick={() => onSelectProject(chat.id)}
                />
              ))}
            </>
          )}

          {regularChats.length > 0 && pinnedChats.length > 0 && (
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
              ALL CHATS
            </div>
          )}

          {regularChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isSelected={chat.id === selectedProjectId}
              onClick={() => onSelectProject(chat.id)}
            />
          ))}

          {filteredChats.length === 0 && !loading && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {search ? "No projects found" : "No projects yet"}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

interface ChatListItemProps {
  chat: ProjectChat;
  isSelected: boolean;
  onClick: () => void;
}

const ChatListItem = ({ chat, isSelected, onClick }: ChatListItemProps) => {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
        isSelected ? "bg-accent" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-semibold text-sm truncate flex-1">{chat.name}</h3>
        {chat.unreadCount > 0 && (
          <Badge variant="default" className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-xs">
            {chat.unreadCount}
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground truncate flex-1">
          {chat.lastMessage}
        </p>
        <span className="text-xs text-muted-foreground ml-2">
          {format(new Date(chat.lastMessageTime), "HH:mm")}
        </span>
      </div>
    </div>
  );
};
