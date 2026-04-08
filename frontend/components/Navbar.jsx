'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Swords, Trophy, BarChart3, Users, LogOut, User } from 'lucide-react';
import ProfileModal from './ProfileModal';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/battle-arena', label: 'Battle Arena', icon: Swords },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center">

          {/* LEFT — LOGO */}
          <div className="flex items-center gap-2 w-max">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <Swords className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent whitespace-nowrap">
                DSA Battle Royale
              </span>
            </Link>
          </div>

          {/* CENTER — NAV ITEMS */}
          <div className="flex-1 flex justify-center">
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* RIGHT — PROFILE + LOGOUT */}
          <div className="flex items-center space-x-4 w-max">
            <div 
              className="flex items-center space-x-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors"
              onClick={() => setShowProfile(true)}
            >
              <div className="text-right">
                <p className="text-sm font-bold text-white">{user.username}</p>
                <p className="text-xs text-orange-400">Rating: {user.rating}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.username[0].toUpperCase()}
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfile(false)} 
          onUpdate={(updatedUser) => {
            // Update local user state
            if (typeof window !== 'undefined') {
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          }}
        />
      )}
    </nav>
  );
}
