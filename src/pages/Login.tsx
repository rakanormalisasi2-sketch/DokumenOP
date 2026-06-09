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
import { Info, Key, LogIn, Eye, EyeOff, Building2, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Request code dialog state
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestName, setRequestName] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate loading
    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = login(code.trim());
    
    if (success) {
      if (code.trim() === 'bidangop') {
        navigate('/admin');
      } else {
        navigate('/respondent');
      }
    } else {
      setError('Kode akses tidak valid. Silakan coba lagi.');
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
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setRequestSuccess(true);
      toast.success('Permintaan kode akses berhasil dikirim!');
    } catch (error) {
      toast.error('Gagal mengirim permintaan. Silakan coba lagi.');
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
        <div class="absolute bottom-[-10%] right-[-10%] w-1/2 h-1/2 bg-primary-container rounded-full blur-[120px]"></div>
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
              Akses sistem terbatas. Silakan masukkan kode akses resmi yang telah diberikan oleh Administrator.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Single Input: Kode Akses */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="accessCode">Kode Akses</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  id="accessCode"
                  name="accessCode"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan kode unik Anda"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
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
              disabled={!code.trim() || isLoading}
              className="w-full py-2 bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-on-secondary font-label-md text-label-md rounded-DEFAULT transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk'}</span>
              {!isLoading && <LogIn className="w-5 h-5" />}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 pt-6 border-t border-outline-variant text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Belum punya kode akses? <br className="md:hidden"/>
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
              Silakan lengkapi data di bawah ini. Administrator akan meninjau dan mengirimkan kode akses ke email Anda jika disetujui.
            </DialogDescription>
          </DialogHeader>

          {requestSuccess ? (
            <div className="py-6 text-center">
              <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-title-lg text-primary mb-2">Permintaan Terkirim!</h3>
              <p className="text-on-surface-variant font-body-sm mb-6">
                Permintaan kode akses Anda sudah dikirim ke admin. Anda akan menerima kode akses melalui email setelah disetujui.
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
