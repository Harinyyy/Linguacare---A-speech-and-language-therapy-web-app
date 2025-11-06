import React from 'react';
import type { Page, User } from '../types';
import { DashboardIcon, ExercisesIcon, ScheduleIcon, SettingsIcon, AdminShieldIcon } from './Icons';

interface SidebarProps {
  user: User;
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const userNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'exercises', label: 'Exercises', icon: ExercisesIcon },
    { id: 'schedule', label: 'Schedule', icon: ScheduleIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
] as const;

const adminNavItems = [
    { id: 'admin_panel', label: 'Admin Panel', icon: AdminShieldIcon },
    { id: 'schedule', label: 'Schedule', icon: ScheduleIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
] as const;


export const Sidebar: React.FC<SidebarProps> = ({ user, activePage, onNavigate }) => {
  
  const navItems = user.role === 'admin' ? adminNavItems : userNavItems;
  
  const renderNavItem = (item: typeof userNavItems[number] | typeof adminNavItems[number]) => {
    const isActive = activePage === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-base font-medium transition-all duration-200 ease-in-out group ${
            isActive 
            ? 'bg-teal-50 text-teal-700 font-semibold' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        {isActive && (
          <div className="absolute left-0 h-6 w-1 bg-teal-500 rounded-r-full" />
        )}
        <item.icon aria-hidden="true" className={`h-6 w-6 transition-transform group-hover:scale-110 ${isActive ? 'text-teal-600' : 'text-slate-500'}`} />
        {item.label}
      </button>
    );
  };
  
  return (
    <aside className="w-64 bg-white shadow-lg flex-shrink-0 z-10 hidden md:flex md:flex-col">
      <div className="p-4">
        <nav className="space-y-2">
            {navItems.map(renderNavItem)}
        </nav>
      </div>
    </aside>
  );
};