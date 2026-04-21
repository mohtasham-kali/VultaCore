"use client";

import { MessageSquare, Eye, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface PostCardProps {
  id: string;
  title: string;
  author: string;
  timeAgo: string;
  preview: string;
  tags: string[];
  likes: number;
  comments: number;
  isResolved?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export function PostCard({ id, title, author, timeAgo, preview, tags, likes: initialLikes, comments, isResolved, severity }: PostCardProps) {
  const router = useRouter();
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (hasLiked) {
      setLikes(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setHasLiked(true);
    }
  };

  const handleCardClick = () => {
    router.push(`/forum/post?id=${id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-slate-900/50 border border-white/5 rounded-xl p-6 hover:border-purple-500/30 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-slate-100 group-hover:text-purple-400 transition-colors">
              {title}
            </h3>
            {severity && (
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                severity === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                  : severity === 'high' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                  : severity === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              )}>
                {severity}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500" />
            <span className="text-slate-400">{author}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </div>
        {isResolved && (
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
            Resolved
          </span>
        )}
      </div>

      <p className="text-slate-400 mb-6 line-clamp-2">
        {preview}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {tags.map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs border border-white/5">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 text-slate-500 text-sm">
          <button 
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 transition-colors hover:text-purple-400 z-10 relative",
              hasLiked && "text-purple-500 font-medium"
            )}
          >
            <ThumbsUp className={cn("w-4 h-4", hasLiked && "fill-current")} />
            <span>{likes}</span>
          </button>
          
          <button className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>{comments}</span>
          </button>

          <button className="px-4 py-2 rounded-lg bg-white/5 text-white text-xs font-medium hover:bg-white/10 transition-colors border border-white/10">
            View Post
          </button>
        </div>
      </div>
    </div>
  );
}
