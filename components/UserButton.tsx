"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth, useUser } from "./AuthProvider";
import Link from "next/link";
import { LogOut, User, Settings } from "lucide-react";

export default function UserButton() {
  const { user } = useUser();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center focus:outline-none"
      >
        <img
          src={user.imageUrl}
          alt={user.fullName || "Profile"}
          className="h-9 w-9 rounded-full border border-teal-200 hover:ring-2 hover:ring-teal-500 transition object-cover"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-xl border border-gray-100 z-[100] py-2 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
             <img
                src={user.imageUrl}
                alt="Profile"
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.fullName || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user.primaryEmailAddress?.emailAddress}</p>
              </div>
          </div>
          
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 transition"
            >
              <User size={16} className="text-gray-400" />
              Profile
            </Link>
          </div>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <LogOut size={16} className="text-red-400" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
