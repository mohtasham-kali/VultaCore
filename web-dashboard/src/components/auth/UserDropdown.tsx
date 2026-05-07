"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { User, LogOut, Settings, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { EditProfileModal } from "../profile/EditProfileModal";
import Image from "next/image";

export function UserDropdown() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return (
      <Link href="/auth" className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-sm font-semibold">
        Sign In
      </Link>
    );
  }

  // Use the user's avatar from Google/Apple or a fallback gradient
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div 
      className="relative" 
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button 
        className="relative group flex items-center focus:outline-none transition-transform hover:scale-105"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Profile"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full border-2 border-white/20 object-cover"
            unoptimized
          />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 border-2 border-white/20">
            <span className="text-white font-bold text-sm">
              {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <div 
          className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
            setIsEditModalOpen(true);
          }}
        >
          <Pencil className="w-4 h-4 text-white" />
        </div>
      </button>

      {/* Dropdown Menu */}
      <div 
        className={`absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl py-2 z-50 transition-all duration-200 ease-out origin-top-right ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="px-4 py-2 border-b border-white/5 mb-1">
          <p className="text-xs text-slate-400 truncate">Signed in as</p>
          <p className="text-sm font-semibold text-white truncate">{user.email}</p>
        </div>
        
        <Link 
          href="/profile" 
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          onClick={() => setIsOpen(false)}
        >
          <User className="w-4 h-4" />
          Edit Profile
        </Link>
        <Link 
          href="/settings" 
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          onClick={() => setIsOpen(false)}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        
        <div className="h-px bg-white/5 my-1" />
        
        <button 
          onClick={async () => {
            await signOut();
            setIsOpen(false);
          }}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
