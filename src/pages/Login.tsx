import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Info, LogIn, Eye, EyeOff, Building2, Mail, CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Request access dialog state
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestName, setRequestName] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;
  const lockSecondsLeft = isLocked ? Math.ceil((lockedUntil! - Date.now()) / 1000) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLocked) {
      setError(`Terlalu banyak percobaan. Coba lagi dalam ${lockSecondsLeft} detik.`);
      return;
    }

    setIsLoading(true);

    const { error: loginError } = await login(email.trim(), password);

    if (loginError) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockedUntil(Date.now() + 30000); // Lock 30 seconds
        setError('Terlalu banyak percobaan gagal. Silakan tunggu 30 detik.');
        setLoginAttempts(0);
      } else {
        setError(`Email atau password salah. (${newAttempts}/5 percobaan)`);
      }
    } else {
      setLoginAttempts(0);
      // Navigation handled by onAuthStateChange in AuthContext + ProtectedRoute
      const { data: { session } } = await supabase.auth.getSession();
      const role = session?.user?.user_metadata?.role;
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/respondent');
      }
    }

    setIsLoading(false);
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail || !requestName) {
      toast.error('Mohon lengkapi semua field');
      return;
    }
    setIsRequesting(true);
    try {
      const { error } = await supabase.from('access_requests').insert({
        id: crypto.randomUUID(),
        name: requestName,
        email: requestEmail,
        status: 'pending',
        request_date: new Date().toISOString(),
      });
      
      if (error) throw error;

      setRequestSuccess(true);
      toast.success('Permintaan akses berhasil dikirim!');
    } catch (error: any) {
      console.error('Request Access Error:', error);
      toast.error(`Gagal mengirim permintaan: ${error.message || 'Akses Ditolak (Periksa Aturan RLS)'}`);
    } finally {
      setIsRequesting(false);
    }
  };

  const resetRequestDialog = () => {
    setShowRequestDialog(false);
    setRequestEmail('');
    setRequestName('');
    setRequestSuccess(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-1/2 h-1/2 bg-secondary-container rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-1/2 h-1/2 bg-primary-container rounded-full blur-[120px]"></div>
      </div>

      {/* Login Card Container */}
      <main className="relative z-10 w-full max-w-[440px] bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Header Section */}
        <header className="p-6 border-b border-outline-variant bg-surface-bright flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Building2 className="text-on-primary w-8 h-8" />
          </div>
          <h1 className="font-title-lg text-title-lg text-primary mb-1">Akses Portal PUSDAOP</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Portal Operasi Dokumen Pemerintah</p>
        </header>

        {/* Main Form Content */}
        <div className="p-6">
          {/* Information Banner */}
          <div className="mb-6 p-3 bg-surface-container rounded-lg border border-outline-variant flex items-start space-x-2">
            <Info className="text-on-surface-variant mt-0.5 w-5 h-5 shrink-0" />
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
              Masukkan email dan password resmi yang diberikan oleh Administrator.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="loginEmail">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  id="loginEmail"
                  name="email"
                  type="email"
                  placeholder="email@instansi.go.id"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-DEFAULT focus:ring-2 focus:ring-secondary focus:border-secondary font-body-md text-body-md text-on-surface placeholder:text-outline transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="loginPassword">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  id="loginPassword"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password Anda"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-surface border border-outline-variant rounded-DEFAULT focus:ring-2 focus:ring-secondary focus:border-secondary font-body-md text-body-md text-on-surface placeholder:text-outline transition-all"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-error">{error}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!email.trim() || !password || isLoading || isLocked}
              className="w-full py-2 bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-on-secondary font-label-md text-label-md rounded-DEFAULT transition-colors flex items-center justify-center space-x-2 shadow-sm mt-2"
            >
              <span>{isLoading ? 'Memverifikasi...' : isLocked ? `Tunggu ${lockSecondsLeft}s...` : 'Masuk'}</span>
              {!isLoading && !isLocked && <LogIn className="w-5 h-5" />}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 pt-6 border-t border-outline-variant text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Belum punya akses? <br className="md:hidden"/>
              <button
                onClick={() => setShowRequestDialog(true)}
                className="font-label-md text-secondary hover:text-secondary-fixed-dim underline transition-colors focus:outline-none ml-1"
              >
                Ajukan Permohonan
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Request Modal */}
      <Dialog open={showRequestDialog} onOpenChange={resetRequestDialog}>
        <DialogContent className="sm:max-w-md bg-surface-container-lowest border-outline-variant">
          <DialogHeader>
            <DialogTitle className="font-title-lg text-title-lg text-primary">Permohonan Akses</DialogTitle>
            <DialogDescription className="font-body-sm text-body-sm text-on-surface-variant">
              Silakan lengkapi data di bawah ini. Administrator akan meninjau dan memberikan akses ke email Anda jika disetujui.
            </DialogDescription>
          </DialogHeader>

          {requestSuccess ? (
            <div className="py-6 text-center">
              <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-title-lg text-primary mb-2">Permintaan Terkirim!</h3>
              <p className="text-on-surface-variant font-body-sm mb-6">
                Permintaan akses Anda sudah diterima. Admin akan membuat akun dan menghubungi Anda.
              </p>
              <button
                onClick={resetRequestDialog}
                className="w-full py-2 bg-primary hover:bg-primary/90 text-on-primary font-label-md rounded-DEFAULT transition-colors"
              >
                Tutup
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequestCode} className="space-y-4 pt-4">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="companyName">Nama Instansi / Perusahaan</label>
                <input
                  id="companyName"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  placeholder="Cth: PT Contoh Perusahaan"
                  required
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-DEFAULT focus:ring-2 focus:ring-secondary focus:border-secondary font-body-md text-on-surface placeholder:text-outline transition-all"
                  type="text"
                />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="emailAddress">Alamat Email Resmi</label>
                <input
                  id="emailAddress"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  placeholder="Cth: admin@instansi.go.id"
                  required
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-DEFAULT focus:ring-2 focus:ring-secondary focus:border-secondary font-body-md text-on-surface placeholder:text-outline transition-all"
                  type="email"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={resetRequestDialog}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface font-label-md rounded-DEFAULT transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isRequesting}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary font-label-md rounded-DEFAULT transition-colors shadow-sm disabled:opacity-50"
                >
                  {isRequesting ? 'Mengirim...' : 'Kirim Permohonan'}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
