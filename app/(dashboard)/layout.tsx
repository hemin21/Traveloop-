"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import {
  Compass,
  Search,
  Bell,
  Home,
  Map as MapIcon,
  PlusCircle,
  Star,
  Users,
  CheckSquare,
  FileText,
  User,
  Shield,
  Menu,
  X
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Fetch user profile to check admin status
    const checkAdminStatus = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          // Assuming the API returns { isAdmin: boolean, ... }
          setIsAdmin(!!data.isAdmin);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };

    if (isLoaded && user) {
      checkAdminStatus();
    }
  }, [isLoaded, user]);

  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'My Trips', href: '/trips', icon: MapIcon },
    { name: 'Plan a Trip', href: '/trips/new', icon: PlusCircle, highlight: true },
    { name: 'Search Cities', href: '/search/cities', icon: Search },
    { name: 'Activities', href: '/search/activities', icon: Star },
    { name: 'Community', href: '/community', icon: Users },
    { name: 'Packing Checklist', href: '/trips', icon: CheckSquare },
    { name: 'Trip Notes', href: '/trips', icon: FileText },
  ];

  const bottomLinks = [
    { name: 'Profile', href: '/profile', icon: User },
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: Shield }] : [])
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const NavItem = ({ item, onClick }: { item: any, onClick?: () => void }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    
    if (item.highlight) {
      return (
        <Link
          href={item.href}
          onClick={onClick}
          className="flex items-center justify-center gap-2 px-4 py-3 mx-4 mt-4 mb-2 text-white transition-colors bg-teal-600 rounded-lg shadow-sm hover:bg-teal-700"
        >
          <Icon size={20} />
          <span className="font-semibold">{item.name}</span>
        </Link>
      );
    }

    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 mx-3 my-1 rounded-lg transition-colors ${
          isActive 
            ? 'bg-teal-100 text-teal-700' 
            : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'
        }`}
        style={isActive ? { borderLeftWidth: '3px', borderLeftColor: '#0d9488', borderLeftStyle: 'solid', marginLeft: '9px', paddingLeft: '13px' } : {}}
      >
        <Icon size={20} />
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-teal-50">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-teal-100 shadow-sm transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-teal-100 lg:hidden">
          <Link href="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
            <Compass className="text-teal-700" size={24} />
            <span className="text-xl font-bold text-teal-700">Traveloop</span>
          </Link>
          <button onClick={closeMobileMenu} className="p-1 text-gray-500 rounded-md hover:bg-teal-50 hover:text-teal-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 py-4 overflow-y-auto">
          {navLinks.map((link) => (
            <NavItem key={link.name} item={link} onClick={closeMobileMenu} />
          ))}
        </div>

        <div className="p-4 border-t border-teal-100">
          {bottomLinks.map((link) => (
            <NavItem key={link.name} item={link} onClick={closeMobileMenu} />
          ))}
          
          {isLoaded && user && (
            <div className="flex items-center gap-3 px-4 py-3 mt-2 text-sm text-gray-700 bg-gray-50 rounded-lg mx-3">
              <div className="shrink-0">
                <UserButton afterSignOutUrl="/" />
              </div>
              <span className="font-medium truncate">{user.fullName || user.username || 'User'}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-teal-100 shadow-sm lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-gray-500 rounded-md hover:bg-teal-50 hover:text-teal-700 lg:hidden"
            >
              <Menu size={24} />
            </button>
            <Link href="/" className="items-center hidden gap-2 lg:flex">
              <Compass className="text-teal-700" size={24} />
              <span className="text-xl font-bold text-teal-700">Traveloop</span>
            </Link>
          </div>

          <div className="flex-1 max-w-xl px-4 mx-auto lg:mx-8">
            <div 
              className="relative flex items-center w-full h-10 px-4 transition-colors bg-gray-100 rounded-full cursor-text hover:bg-gray-200"
              onClick={() => router.push('/search/cities')}
            >
              <Search className="text-gray-500" size={18} />
              <span className="ml-3 text-sm text-gray-500">Search cities, activities...</span>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <button className="p-2 text-gray-500 transition-colors rounded-full hover:bg-teal-50 hover:text-teal-700">
              <Bell size={20} />
            </button>
            <div className="hidden lg:block shrink-0">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 overflow-y-auto bg-teal-50 lg:p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
