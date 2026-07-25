"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { Send, Hash, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  room: string;
  content: string;
  createdAt: string;
  author?: { username: string; id: string };
}

import { API_BASE_URL } from "@/lib/constants";

interface LiveChatPanelProps {
  room: "dev" | "cyber";
}

export function LiveChatPanel({ room }: LiveChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (endOfMessagesRef.current) {
        endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  }, []);

  useEffect(() => {
    // 1. Establish connection
    const socketUrl = API_BASE_URL.startsWith('/') ? window.location.origin : API_BASE_URL.replace(/\/api$/, '');
    const newSocket = io(socketUrl, { transports: ["websocket"] });
    
    newSocket.on("connect", () => {
      setIsConnected(true);
      newSocket.emit("joinRoom", room);
    });

    // 2. Listeners
    newSocket.on("chatHistory", (history: ChatMessage[]) => {
      setMessages(history);
      scrollToBottom();
    });

    newSocket.on("newMessage", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    newSocket.on("disconnect", () => setIsConnected(false));
    
    socketRef.current = newSocket;

    return () => {
      // Cleanup connection on unmount
      newSocket.off("connect");
      newSocket.off("chatHistory");
      newSocket.off("newMessage");
      newSocket.off("disconnect");
      newSocket.emit("leaveRoom", room);
      newSocket.disconnect();
    };
  }, [room, scrollToBottom]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !socketRef.current || !user) return;
    
    socketRef.current.emit("sendMessage", {
      room,
      content: inputValue.trim(),
      userId: user.id,
      email: user.email,
    });
    
    setInputValue("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sticky top-24 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-white tracking-wide">
            {room === "dev" ? "Dev Lounge" : "Security Operations"}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Users className="w-3.5 h-3.5" />
          {isConnected ? (
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Live</span>
          ) : (
            <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin"/> Syncing</span>
          )}
        </div>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.map((msg, idx) => {
          const isMe = msg.author?.id === user?.id;
          
          return (
            <div key={idx} className={cn("flex flex-col max-w-[85%]", isMe ? "ml-auto" : "")}>
              <div className={cn("text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1 px-1", isMe ? "text-right" : "")}>
                {isMe ? "You" : msg.author?.username || "Anonymous"}
              </div>
              <div 
                className={cn(
                  "p-3 rounded-2xl text-sm leading-relaxed", 
                  isMe 
                    ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-sm shadow-md"
                    : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 bg-slate-950/50 border-t border-white/5 shrink-0">
        {user ? (
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input 
              type="text"
              placeholder="Chat strictly professional..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-3.5 pl-5 pr-14 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-slate-600"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-2 p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-full transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="w-full text-center py-3 bg-red-500/10 border border-red-500/20 rounded-full">
            <p className="text-red-400 text-xs font-semibold uppercase tracking-widest">
              Please Log In To Chat
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
