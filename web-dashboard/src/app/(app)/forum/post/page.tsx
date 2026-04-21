"use client";

import { PostDetailClient } from "./PostDetailClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function PostDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-slate-500 animate-pulse uppercase tracking-widest text-xs font-bold">Initial Loading...</p>
      </div>
    }>
      <PostDetailClient />
    </Suspense>
  );
}
