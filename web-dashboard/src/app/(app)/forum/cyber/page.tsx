"use client";

import { PostCard } from "@/components/forum/PostCard";
import { Search, Plus, Filter, ShieldCheck, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { fetchPosts } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CreatePostModal } from "@/components/forum/CreatePostModal";

export default function CyberForumPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPosts('cyber');
      setPosts(data);
    } catch (e) {
      console.error("Failed to load posts", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return (
    <div className="space-y-8">
      <CreatePostModal 
        type="cyber"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadPosts}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            Security Hub
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </h1>
          <p className="text-slate-400 text-sm">Exclusive discussions on vulnerabilities, pentesting, and forensics.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Report
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
          <input 
            type="text" 
            placeholder="Search CVEs, exploits, or mitigation strategies..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
          />
        </div>
        <button className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
          <Filter className="w-4 h-4" />
          Severity
        </button>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-500 font-medium tracking-wide">Querying Security Database...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
             <PostCard 
              key={post.id}
              id={post.id}
              title={post.title}
              author={post.author?.username || 'Anonymous'}
              timeAgo="Recently"
              preview={post.content.substring(0, 150) + '...'}
              tags={post.tags}
              likes={post.likes}
              comments={post.commentsCount}
              isResolved={post.isResolved}
              severity={post.severity}
            />
          ))}
          {posts.length === 0 && (
            <div className="text-center py-20 border border-dashed border-white/5 rounded-2xl">
              <p className="text-slate-500">No security reports found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
