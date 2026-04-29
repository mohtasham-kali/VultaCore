"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export function JoinForumButton() {
  const { user } = useAuth();
  const router = useRouter();

  const handleJoinClick = () => {
    if (user) {
      router.push("/forum/dev");
    } else {
      router.push("/auth");
    }
  };

  return (
    <button 
      onClick={handleJoinClick} 
      className="px-8 py-3 rounded-xl bg-white text-black font-semibold hover:scale-105 transition-transform"
    >
      Join Forum
    </button>
  );
}
