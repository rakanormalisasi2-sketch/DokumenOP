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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-foreground">DocMS</h1>
                <p className="text-xs text-muted-foreground">Portal Responden</p>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'gap-2',
                        isActive && 'shadow-md'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
              <div className="w-px h-6 bg-border mx-2" />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Keluar</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
