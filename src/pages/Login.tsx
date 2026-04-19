import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Lock, AlertCircle, Mail, Building2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      // For now, we just simulate sending a request to admin
      // In real implementation, this would create an access request in database
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
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative animate-scale-in shadow-elevated">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <FileText className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-heading">
            Sistem Manajemen Dokumen
          </CardTitle>
          <CardDescription className="text-base">
            Masukkan kode akses untuk melanjutkan
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Masukkan kode akses"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="pl-10 h-12 text-base"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg animate-scale-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              variant="hero" 
              size="lg" 
              className="w-full"
              disabled={!code.trim() || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Memverifikasi...
                </span>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Belum memiliki kode akses?
            </p>
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => setShowRequestDialog(true)}
            >
              <Mail className="w-4 h-4" />
              Request Kode Akses
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Request Code Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={resetRequestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Request Kode Akses
            </DialogTitle>
            <DialogDescription>
              Masukkan data Anda untuk mengajukan kode akses. Admin akan mengirimkan kode ke email Anda.
            </DialogDescription>
          </DialogHeader>

          {requestSuccess ? (
            <div className="py-8 text-center">
              <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Permintaan Terkirim!</h3>
              <p className="text-muted-foreground text-sm">
                Permintaan kode akses Anda sudah dikirim ke admin. Anda akan menerima kode akses melalui email setelah disetujui.
              </p>
              <Button className="mt-6" onClick={resetRequestDialog}>
                Tutup
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRequestCode} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Perusahaan/Instansi</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="PT Contoh Perusahaan"
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@perusahaan.com"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={resetRequestDialog}>
                  Batal
                </Button>
                <Button type="submit" disabled={isRequesting} className="gap-2">
                  {isRequesting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Kirim Permintaan
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
