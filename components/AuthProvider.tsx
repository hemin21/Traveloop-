"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  refreshUser: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// To make migration even easier, let's mimic useUser hook surface area:
export const useUser = () => {
  const { user, isLoading } = useAuth();
  return { 
    user: user ? {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.firstName ? `${user.firstName} ${user.lastName}` : "",
      imageUrl: user.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
      primaryEmailAddress: { emailAddress: user.email },
      emailAddresses: [{ emailAddress: user.email }]
    } : null, 
    isLoaded: !isLoading, 
    isSignedIn: !!user 
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      // Optimization: avoid unnecessary fetches for static landing assets, but for now simpler is better.
      if (pathname === "/sign-in" || pathname === "/sign-up") {
         setIsLoading(false);
         return;
      }

      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/sign-in");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser: fetchUser, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}
