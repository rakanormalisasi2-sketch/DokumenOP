import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  Table2,
  Users,
  FilePlus,
  ScrollText,
  LogOut,
  Search,
  Bell,
  HelpCircle,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/submissions', icon: Table2, label: 'Data Pengajuan' },
  { href: '/admin/templates', icon: FileText, label: 'Kelola Template' },
  { href: '/admin/fields', icon: FilePlus, label: 'Kelola Field' },
  { href: '/admin/kontrak', icon: ScrollText, label: 'Dokumen Kontrak' },
  { href: '/admin/users', icon: Users, label: 'Kelola Akses' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex">
      {/* SideNavBar */}
      <nav className="bg-surface w-[280px] h-full fixed left-0 top-0 border-r border-outline-variant flex flex-col py-6 px-4 z-50">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4 px-2">
          <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden">
            <Users className="text-primary w-6 h-6" />
          </div>
          <div>
            <h2 className="font-headline-md text-xl font-bold text-primary">Admin PUSDAOP</h2>
            <p className="font-body-sm text-sm text-on-surface-variant">Administrator</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-4 px-4 py-3 rounded-lg font-label-md text-sm transition-all duration-200',
                  isActive
                    ? 'text-secondary font-bold bg-secondary-container/10 border-r-4 border-secondary opacity-90'
                    : 'text-on-surface-variant hover:text-secondary hover:bg-surface-container-high'
                )}
              >
                <item.icon className={cn('w-5 h-5', isActive && 'text-secondary')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer Links */}
        <div className="mt-auto pt-6 border-t border-outline-variant flex flex-col gap-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 rounded-lg text-error hover:bg-error-container/20 transition-colors duration-200 w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-label-md text-sm">Keluar</span>
          </button>
        </div>
      </nav>

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col ml-[280px] w-[calc(100%-280px)]">
        {/* TopNavBar */}
        <header className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-40 flex justify-between items-center w-full px-6 h-16">
          <div className="flex items-center gap-8">
            <div className="font-title-lg text-xl font-black text-primary">PUSDAOP</div>
            {/* Search on Left */}
            <div className="relative w-64 hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4 pointer-events-none" />
              <input 
                className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest transition-all" 
                placeholder="Cari dokumen..." 
                type="text" 
              />
            </div>
          </div>

          {/* Navigation Links (Top) */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/admin" className="text-secondary font-bold border-b-2 border-secondary pb-1 font-label-md text-sm">Dashboard</Link>
          </nav>

          {/* Trailing Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-on-surface-variant hover:text-secondary transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <button className="p-2 text-on-surface-variant hover:text-secondary transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-surface-variant overflow-hidden ml-2 cursor-pointer border border-outline-variant flex items-center justify-center">
              <Users className="w-4 h-4 text-on-surface-variant" />
            </div>
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 p-6 lg:p-8 max-w-[1280px] mx-auto w-full flex flex-col gap-6 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
