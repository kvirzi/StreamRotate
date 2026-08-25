import { useState } from 'react';
import {
  LayoutDashboard, Tv2, List, RotateCcw, Compass,
  Bell, Settings, Heart, LogOut, Menu, X, ChevronRight,
  MessageSquarePlus, LucideIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Logo } from './Logo';
import { useNavigate } from 'react-router-dom';

export type AppPage =
  | 'dashboard'
  | 'services'
  | 'shows'
  | 'rotation'
  | 'suggestions'
  | 'reminders'
  | 'feedback'
  | 'settings'
  | 'support';

interface NavItem {
  id: AppPage;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'services', label: 'My Services', icon: Tv2 },
  { id: 'shows', label: 'My Shows', icon: List },
  { id: 'rotation', label: 'Rotation Plan', icon: RotateCcw },
  { id: 'suggestions', label: 'Discover', icon: Compass },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'feedback', label: 'Feedback', icon: MessageSquarePlus },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'support', label: 'Support Us', icon: Heart },
];

interface SidebarProps {
  currentPage: AppPage;
  onPageChange: (page: AppPage) => void;
  userEmail?: string;
  plan?: 'free' | 'pro';
}

export function Sidebar({ currentPage, onPageChange, userEmail, plan = 'free' }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-bg-border">
        <Logo size="md" />
        {plan === 'pro' && (
          <div className="mt-2">
            <span className="badge bg-accent-purple/20 text-accent-purple border border-accent-purple/30">
              Pro
            </span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => { onPageChange(id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                ${active
                  ? 'bg-accent-orange/15 text-accent-orange border border-accent-orange/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
            >
              <Icon size={18} className={active ? 'text-accent-orange' : 'text-text-muted group-hover:text-text-secondary'} />
              <span className="flex-1 text-left">{label}</span>
              {active && <ChevronRight size={14} className="text-accent-orange/60" />}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-bg-border">
        {userEmail && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-text-muted truncate">{userEmail}</p>
            <p className="text-xs font-medium text-text-secondary capitalize">{plan} plan</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-red-400 hover:bg-red-900/10 transition-all"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-bg-secondary border-r border-bg-border fixed left-0 top-0 h-full z-30">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 bg-bg-secondary border-b border-bg-border flex items-end"
        style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(env(safe-area-inset-top) + 52px)' }}
      >
        <div className="flex items-center justify-between w-full px-4 pb-2">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl text-text-secondary">
            <Menu size={22} />
          </button>
          <Logo size="sm" />
          <div className="w-10" />
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-bg-secondary border-r border-bg-border flex flex-col h-full safe-top safe-bottom">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 p-1.5 text-text-muted hover:text-text-primary"
              style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
            >
              <X size={20} />
            </button>
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
