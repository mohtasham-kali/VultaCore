"use client";

import { PostCard } from "@/components/forum/PostCard";
import { Search, Plus, Filter, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { fetchPosts } from "@/lib/api";
import { CreatePostModal } from "@/components/forum/CreatePostModal";

export default function DevForumPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPosts('dev');
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
        type="dev"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadPosts}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dev Forum</h1>
          <p className="text-slate-400 text-sm">Join the discussion, earn points, and solve code issues.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search posts by title, tag, or content..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
          />
        </div>
        <button className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
          <Filter className="w-4 h-4" />
          Latest
        </button>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          <p className="text-slate-500 font-medium tracking-wide">Syncing with Node.js Backend...</p>
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
            />
          ))}
          {posts.length === 0 && (
            <div className="text-center py-20 border border-dashed border-white/5 rounded-2xl">
              <p className="text-slate-500">No posts found in the dev category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
