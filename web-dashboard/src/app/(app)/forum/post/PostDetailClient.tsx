"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, ThumbsUp, Send, Share2, MoreHorizontal, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { fetchPostDetail, createComment, likePost } from "@/lib/api";

export function PostDetailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id") || "";
  
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadPost = useCallback(async () => {
    try {
      const data = await fetchPostDetail(id);
      setPost(data);
    } catch (e) {
      console.error("Failed to load post", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleAddComment = async () => {
    if (!newComment.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      await createComment(id, newComment);
      setNewComment("");
      await loadPost(); // Refresh post to show new comment
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    // Optimistic update
    setPost({ ...post, likes: post.likes + 1 });
    try {
      await likePost(id);
    } catch (e) {
      console.error(e);
      // Rollback on error if needed, but keeping it simple for dev
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-slate-500 animate-pulse uppercase tracking-widest text-xs font-bold">Retrieving Post Data...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20 bg-slate-900/50 border border-dashed border-white/10 rounded-3xl">
        <h2 className="text-2xl font-bold text-white mb-4">Post not found</h2>
        <button 
          onClick={() => router.back()}
          className="px-6 py-2 bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Forum
      </button>

      {/* Main Post Content */}
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-8 relative overflow-hidden">
        <div className={`absolute -top-12 -right-12 w-32 h-32 ${post.type === 'cyber' ? 'bg-emerald-500/10' : 'bg-purple-500/10'} blur-3xl rounded-full`} />
        
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-full ${post.type === 'cyber' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'} flex items-center justify-center font-bold text-lg border border-white/5`}>
              {post.author?.username?.[0] || 'A'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{post.title}</h1>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Posted by <span className={post.type === 'cyber' ? 'text-emerald-400' : 'text-purple-400'}>{post.author?.username || 'Anonymous'}</span></span>
                <span>•</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <button className="text-slate-500 hover:text-white p-2">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="prose prose-invert max-w-none mb-8 text-slate-300 whitespace-pre-line leading-relaxed">
          {post.content}
        </div>

        <div className="flex gap-2 mb-8">
          {post.tags?.map((tag: string) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-slate-950 border border-white/10 text-[10px] text-slate-400 uppercase tracking-wider">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex gap-4">
            <button 
              onClick={handleLike}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-950 text-slate-300 hover:text-purple-400 transition-colors border border-white/5"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{post.likes} Likes</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-950 text-slate-300 hover:text-blue-400 transition-colors border border-white/5">
              <MessageSquare className="w-4 h-4" />
              <span>{post.comments?.length || 0} Comments</span>
            </button>
          </div>
          <button className="flex items-center gap-2 text-slate-400 hover:text-white group">
            <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Share
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-white mb-6">Comments ({post.comments?.length || 0})</h3>
        
        {/* Comment Input */}
        <div className="flex gap-4 mb-8">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-bold mt-1 border border-purple-500/20">
            Y
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add to the discussion..."
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-slate-200 outline-none focus:border-purple-500/50 min-h-[100px] mb-3 placeholder:text-slate-600 transition-all font-sans"
            />
            <div className="flex justify-end">
              <button 
                onClick={handleAddComment}
                disabled={!newComment.trim() || submittingComment}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center gap-2 font-medium transition-all"
              >
                {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submittingComment ? 'Sending...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-6">
          {post.comments?.map((comment: any) => (
            <div key={comment.id} className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-sm font-bold border border-white/5">
                {comment.author?.username?.[0] || 'A'}
              </div>
              <div className="flex-1">
                <div className="bg-slate-950/30 rounded-xl p-4 border border-white/5 group-hover:border-white/10 transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-200">{comment.author?.username || 'Anonymous'}</span>
                    <span className="text-xs text-slate-500 font-mono tracking-tighter opacity-50 uppercase">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-purple-400 transition-colors">
                      <ThumbsUp className="w-3 h-3" />
                      {comment.likes}
                    </button>
                    <button className="text-xs text-slate-500 hover:text-white transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!post.comments?.length && (
            <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl">
              <p className="text-slate-500 text-sm">No comments yet. Be the first to start the conversation!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
