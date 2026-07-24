import { useState, useMemo, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Copy,
  Check,
  UserPlus,
  KeyRound,
  Clock,
  Mail,
  Send,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AccessRequest {
  id: string;
  name: string;
  email: string;
  requestDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  code?: string;
}

const sampleRequests: AccessRequest[] = [
  {
    id: '1',
    name: 'PT Maju Bersama',
    email: 'info@majubersama.co.id',
    requestDate: new Date('2024-01-20'),
    status: 'pending',
  },
  {
    id: '2',
    name: 'CV Karya Mandiri',
    email: 'admin@karyamandiri.com',
    requestDate: new Date('2024-01-18'),
    status: 'approved',
    code: 'KM2024A',
  },
  {
    id: '3',
    name: 'PT Teknologi Nusantara',
    email: 'contact@teknusa.id',
    requestDate: new Date('2024-01-15'),
    status: 'approved',
    code: 'TN2024B',
  },
];

export default function AdminUsers() {
  const { accessRequests } = useData();
  const [requests, setRequests] = useState<AccessRequest[]>([]);

  useEffect(() => {
    // Map data database ke struktur AccessRequest UI
    if (accessRequests && accessRequests.length > 0) {
      const mapped = accessRequests.map((r: any) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        requestDate: new Date(r.request_date || r.requestDate || Date.now()),
        status: r.status,
        code: r.code
      }));
      setRequests(mapped as AccessRequest[]);
    } else {
      setRequests([]);
    }
  }, [accessRequests]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Manual code generation state
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  const [isApproving, setIsApproving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const filteredRequests = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.email.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [requests, searchQuery]
  );

  const handleApprove = async (request: AccessRequest) => {
    setSelectedRequest(request);
    setIsApproving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sesi telah berakhir, silakan login ulang.');

      const response = await fetch('/api/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: request.email,
          name: request.name,
          requestId: request.id
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyetujui akun');

      // Update local state to reflect approved status
      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'approved', code: data.authUserId || undefined } : r));
      
      if (data.emailSent) {
        toast.success(`Akun berhasil dibuat! Password telah dikirim ke ${request.email}`);
      } else {
        toast.success('Akun responden berhasil dibuat otomatis!');
        setGeneratedPassword(data.password);
        setShowPasswordDialog(true);
      }
      
    } catch (error: any) {
      console.error('Approve error:', error);
      toast.error(error.message || 'Gagal membuat akun');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectRequest = async (request: AccessRequest) => {
    if (!window.confirm(`Hapus permintaan dari ${request.name}? Data ini akan dihapus permanen dari daftar.`)) return;

    try {
      const { error } = await supabase
        .from('access_requests')
        .delete()
        .eq('id', request.id);

      if (error) throw error;

      setRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success(`Permintaan dari ${request.name} berhasil dihapus.`);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus permintaan.');
    }
  };

  const handleDelete = async (request: AccessRequest) => {
    // Check if we have the auth user id stored in the 'code' field
    if (!request.code) {
      toast.error('Gagal menghapus: UID pengguna tidak ditemukan di data ini (Akun dibuat sebelum sistem auto-delete). Hapus manual via Supabase Dashboard.');
      return;
    }

    if (!window.confirm(`PERINGATAN: Apakah Anda yakin ingin MENGHAPUS PERMANEN akun ${request.name} (${request.email})? Seluruh akses login mereka akan dicabut seketika.`)) {
      return;
    }

    setIsDeletingId(request.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sesi telah berakhir, silakan login ulang.');

      const response = await fetch('/api/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          authUserId: request.code, // We stored the UID in the code column earlier
          requestId: request.id
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menghapus akun');

      setRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success('Akun responden berhasil dihapus permanen!');
      
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Gagal menghapus akun');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleManualCreate = () => {
    setManualName('');
    setManualEmail('');
    setGeneratedCode(generateCode());
    setShowManualDialog(true);
  };

  const sendAccessCodeEmail = async (email: string, name: string, code: string) => {
    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-access-code', {
        body: { to: email, name, code },
      });

      if (error) throw error;
      
      toast.success(`Kode akses berhasil dikirim ke ${email}`);
      return true;
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(`Gagal mengirim email: ${error.message}`);
      return false;
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleConfirmCode = async (sendEmail: boolean = false) => {
    if (selectedRequest) {
      if (sendEmail) {
        const success = await sendAccessCodeEmail(
          selectedRequest.email, 
          selectedRequest.name, 
          generatedCode
        );
        if (!success) return;
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, status: 'approved' as const, code: generatedCode }
            : r
        )
      );
      
      toast.success('Kode akses berhasil dibuat');
      setShowGenerateDialog(false);
      setSelectedRequest(null);
    }
  };

  const handleConfirmManualCode = async (sendEmail: boolean = false) => {
    if (!manualName) {
      toast.error('Mohon masukkan nama perusahaan/instansi');
      return;
    }

    if (sendEmail && !manualEmail) {
      toast.error('Mohon masukkan email untuk mengirim kode');
      return;
    }

    if (sendEmail && manualEmail) {
      const success = await sendAccessCodeEmail(manualEmail, manualName, generatedCode);
      if (!success) return;
    }

    const newRequest: AccessRequest = {
      id: crypto.randomUUID(),
      name: manualName,
      email: manualEmail || '-',
      requestDate: new Date(),
      status: 'approved',
      code: generatedCode,
    };

    setRequests((prev) => [...prev, newRequest]);
    toast.success('Kode akses berhasil dibuat');
    setShowManualDialog(false);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Kode berhasil disalin');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Kelola Akses</h1>
            <p className="text-muted-foreground mt-1">
              Kelola permintaan akses dan kode responden
            </p>
          </div>
          <Button className="gap-2" onClick={handleManualCreate}>
            <UserPlus className="w-4 h-4" />
            Buat Kode Manual
          </Button>
        </div>

        {/* Pending Requests */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Permintaan Akses Pending
            </CardTitle>
            <CardDescription>
              Permintaan akses yang menunggu persetujuan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.filter((r) => r.status === 'pending').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada permintaan pending
              </div>
            ) : (
              <div className="space-y-3">
                {requests
                  .filter((r) => r.status === 'pending')
                  .map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 bg-warning/5 border border-warning/20 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{request.name}</p>
                        <p className="text-sm text-muted-foreground">{request.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(request)}
                          className="gap-2 bg-success text-success-foreground hover:bg-success/90"
                          disabled={isApproving && selectedRequest?.id === request.id}
                        >
                          {isApproving && selectedRequest?.id === request.id ? (
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Setujui
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRejectRequest(request)}
                          disabled={isApproving && selectedRequest?.id === request.id}
                        >
                          Tolak
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Users */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Semua Responden</CardTitle>
                <CardDescription>Daftar responden yang memiliki akses</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari responden..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Kode Akses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests
                  .filter((r) => r.status === 'approved')
                  .map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.name}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                          {request.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">Aktif (Responden)</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(request)}
                            disabled={isDeletingId === request.id}
                            title="Hapus Akun Permanen"
                          >
                            {isDeletingId === request.id ? (
                               <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                               "Hapus"
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Generated Password Dialog (for newly approved requests) */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-success">Akun Berhasil Dibuat!</DialogTitle>
              <DialogDescription>
                Akun untuk responden <strong>{selectedRequest?.name}</strong> telah berhasil didaftarkan.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg mb-6">
                <p className="text-sm text-warning font-medium">⚠️ Peringatan Penting</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Harap salin password di bawah ini dan berikan kepada responden. Password ini dibuat otomatis dengan keamanan tinggi dan <strong>tidak akan ditampilkan lagi</strong> setelah Anda menutup jendela ini.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center gap-4">
                <div className="text-center w-full">
                  <p className="text-sm text-muted-foreground mb-2">Email Login</p>
                  <code className="text-lg font-mono bg-muted px-4 py-2 rounded-lg block mb-4 select-all">
                    {selectedRequest?.email}
                  </code>
                  
                  <p className="text-sm text-muted-foreground mb-2">Password Sementara</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-2xl font-mono font-bold bg-muted px-4 py-3 rounded-lg select-all">
                      {generatedPassword}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-[52px] w-[52px]"
                      onClick={() => copyToClipboard(generatedPassword)}
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-success" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button onClick={() => setShowPasswordDialog(false)}>
                Saya Sudah Menyalinnya (Tutup)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manual Code Generation Dialog */}
        <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Buat Kode Akses Manual
              </DialogTitle>
              <DialogDescription>
                Buat kode akses baru untuk responden
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="manual-name">Nama Perusahaan/Instansi *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="manual-name"
                    placeholder="PT Contoh Perusahaan"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-email">Email (opsional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="manual-email"
                    type="email"
                    placeholder="email@perusahaan.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Jika diisi, kode dapat dikirim langsung ke email
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Kode Akses yang Dibuat:</p>
                <div className="flex items-center gap-2">
                  <code className="text-2xl font-mono font-bold bg-muted px-4 py-2 rounded-lg flex-1 text-center">
                    {generatedCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(generatedCode)}
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-success" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setGeneratedCode(generateCode())}
                    title="Generate ulang"
                  >
                    <KeyRound className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowManualDialog(false)}>
                Batal
              </Button>
              <Button variant="secondary" onClick={() => handleConfirmManualCode(false)}>
                Simpan Saja
              </Button>
              <Button 
                onClick={() => handleConfirmManualCode(true)} 
                disabled={isSendingEmail || !manualEmail} 
                className="gap-2"
              >
                {isSendingEmail ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Simpan & Kirim Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
