import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  FileCheck2,
  FilePlus,
  LogOut,
  History,
  Search,
  Bell,
  HelpCircle,
  User,
} from 'lucide-react';

interface RespondentLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/respondent', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/respondent/dokumen-awal', icon: FilePlus, label: 'Dokumen Awal' },
  { href: '/respondent/dokumen-akhir', icon: FileCheck2, label: 'Dokumen Akhir' },
  { href: '/respondent/history', icon: History, label: 'Riwayat Pengajuan' },
];

export default function RespondentLayout({ children }: RespondentLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex">
      {/* SideNavBar */}
      <aside className="bg-surface w-[280px] h-full fixed left-0 top-0 border-r border-outline-variant flex flex-col py-6 px-4 z-50 hidden md:flex">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4 px-2">
          <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center overflow-hidden">
            <User className="text-outline w-6 h-6" />
          </div>
          <div>
            <h2 className="font-headline-md text-xl font-bold text-primary">Responden</h2>
            <p className="font-body-sm text-sm text-on-surface-variant">Portal Pengajuan</p>
          </div>
        </div>

        {/* CTA */}
        <Link to="/respondent/dokumen-awal" className="mb-8 w-full bg-secondary text-on-secondary py-2 px-4 rounded font-label-md text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <FilePlus className="w-5 h-5" />
          <span>Dokumen Baru</span>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex-1 flex flex-col gap-1">
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
        </nav>

        {/* Footer Tabs */}
        <div className="mt-auto pt-6 border-t border-outline-variant flex flex-col gap-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 rounded-lg text-error hover:bg-error-container/20 transition-colors duration-200 w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-label-md text-sm">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 md:ml-[280px] min-w-0 flex flex-col min-h-screen">
        {/* TopNavBar */}
        <header className="bg-surface-container-lowest border-b border-outline-variant w-full top-0 sticky z-40 flex justify-between items-center px-6 h-16">
          <div className="flex items-center gap-8">
            <div className="font-title-lg text-xl font-black text-primary">PUSDAOP</div>
            <nav className="hidden lg:flex gap-6 h-full items-center font-label-md text-sm">
              <Link to="/respondent" className="text-secondary font-bold border-b-2 border-secondary pb-1 h-full flex items-center">Dashboard</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex relative text-on-surface-variant">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
              <input 
                className="pl-10 pr-4 py-2 rounded-full bg-surface-container-low border-none focus:ring-2 focus:ring-secondary text-sm w-48 transition-all" 
                placeholder="Cari..." 
                type="text" 
              />
            </div>
            <button className="text-on-surface-variant hover:text-secondary transition-colors p-2">
              <Bell className="w-5 h-5" />
            </button>
            <button className="text-on-surface-variant hover:text-secondary transition-colors p-2">
              <HelpCircle className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-surface-variant overflow-hidden border border-outline-variant flex items-center justify-center">
              <User className="w-4 h-4 text-on-surface-variant" />
            </div>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="flex-1 p-6 lg:p-8 bg-background max-w-[1280px] mx-auto w-full flex flex-col gap-6">
          {children}
        </main>
      </div>
    </div>
  );
}
