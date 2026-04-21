"use client";

import { useState } from "react";
import { X, Send, Tag, Loader2, Sparkles } from "lucide-react";
import { createPost } from "@/lib/api";
import { cn } from "@/lib/utils";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: 'dev' | 'cyber';
}

export function CreatePostModal({ isOpen, onClose, onSuccess, type }: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tagArray = tags.split(",").map(t => t.trim()).filter(t => t !== "");
      await createPost({ 
        title, 
        content, 
        type, 
        tags: tagArray,
        severity: type === 'cyber' ? severity : undefined
      });
      onSuccess();
      onClose();
      setTitle("");
      setContent("");
      setTags("");
    } catch (error) {
      console.error("Failed to create post", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Glow effect */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 ${type === 'cyber' ? 'bg-emerald-500/20' : 'bg-purple-500/20'} blur-3xl rounded-full`} />
        
        <div className="relative p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {type === 'cyber' ? 'Create Security Report' : 'New Discussion'}
                <Sparkles className={`w-5 h-5 ${type === 'cyber' ? 'text-emerald-400' : 'text-purple-400'}`} />
              </h2>
              <p className="text-slate-400 text-sm">Contribute to the {type} community and earn points.</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Title</label>
              <input 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'cyber' ? "Found a potential vulnerability in..." : "I'm having trouble with..."}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/5 rounded-xl text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Content</label>
              <textarea 
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Details of your post..."
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/5 rounded-xl text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600 resize-none"
              />
            </div>

            {type === 'cyber' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'critical'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={cn(
                        "py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all",
                        severity === s 
                          ? s === 'critical' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                            : s === 'high' ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                            : s === 'medium' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-800/50 border-white/5 text-slate-500 hover:border-white/20'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags (comma separated)
              </label>
              <input 
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="react, security, fix..."
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/5 rounded-xl text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="pt-4 flex justify-end gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium"
              >
                Cancel
              </button>
              <button 
                disabled={loading}
                className={`px-8 py-2.5 rounded-xl text-white font-bold flex items-center gap-2 transition-all shadow-lg ${
                  type === 'cyber' 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-500/20' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-purple-500/20'
                } disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Create Post
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
