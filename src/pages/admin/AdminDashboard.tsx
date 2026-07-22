import { useData } from '@/contexts/DataContext';
import { useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { DOCUMENT_TYPE_LABELS } from '@/types';
import {
  Folder,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Key,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { submissions } = useData();

  const stats = useMemo(() => ({
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'submitted' || s.status === 'review').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    revision: submissions.filter((s) => s.status === 'revision' || s.status === 'rejected').length,
  }), [submissions]);

  const recentSubmissions = useMemo(() => [...submissions]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5), [submissions]);

  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: id });

  return (
    <AdminLayout>
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-3xl font-semibold text-on-surface">Tinjauan Operasional</h1>
          <p className="font-body-md text-base text-on-surface-variant mt-1">Ringkasan aktivitas dan status pengajuan dokumen hari ini.</p>
        </div>
        <div className="text-sm font-body-sm text-on-surface-variant flex items-center gap-2 bg-surface-container py-1.5 px-4 rounded-full border border-outline-variant w-fit">
          <Calendar className="w-4 h-4" />
          {currentDate}
        </div>
      </div>

      {/* Bento Grid: Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col justify-between h-32 hover:border-secondary transition-colors">
          <div className="flex justify-between items-start">
            <span className="font-label-md text-sm font-semibold text-on-surface-variant">Total Pengajuan</span>
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center">
              <Folder className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="font-display-lg text-4xl font-bold text-on-surface">{stats.total}</div>
            <div className="font-body-sm text-xs text-surface-tint mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-secondary" />
              <span>Semua waktu</span>
            </div>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col justify-between h-32 hover:border-secondary transition-colors relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-tertiary-fixed/20 to-transparent pointer-events-none"></div>
          <div className="flex justify-between items-start relative z-10">
            <span className="font-label-md text-sm font-semibold text-on-surface-variant">Menunggu Review</span>
            <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center">
              <Clock className="w-4 h-4 text-tertiary-container" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="font-display-lg text-4xl font-bold text-on-surface">{stats.pending}</div>
            <div className="font-body-sm text-xs text-on-tertiary-container mt-1 font-medium">Perlu perhatian segera</div>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col justify-between h-32 hover:border-secondary transition-colors">
          <div className="flex justify-between items-start">
            <span className="font-label-md text-sm font-semibold text-on-surface-variant">Disetujui</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-on-surface" />
            </div>
          </div>
          <div>
            <div className="font-display-lg text-4xl font-bold text-on-surface">{stats.approved}</div>
            <div className="font-body-sm text-xs text-surface-tint mt-1">Total disetujui</div>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col justify-between h-32 hover:border-secondary transition-colors relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-error-container/20 to-transparent pointer-events-none"></div>
          <div className="flex justify-between items-start relative z-10">
            <span className="font-label-md text-sm font-semibold text-on-surface-variant">Perlu Revisi</span>
            <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-error" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="font-display-lg text-4xl font-bold text-on-surface">{stats.revision}</div>
            <div className="font-body-sm text-xs text-error mt-1 flex items-center gap-1">
              <span>Dikembalikan ke pemohon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Complex Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Table Area (Span 2) */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
            <h3 className="font-title-lg text-lg font-semibold text-on-surface">Pengajuan Terbaru</h3>
            <Link to="/admin/submissions" className="text-secondary font-label-md text-sm hover:underline">Lihat Semua</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface font-label-md text-sm border-b border-outline-variant">
                  <th className="py-2 px-4 font-semibold">Pemohon &amp; Pekerjaan</th>
                  <th className="py-2 px-4 font-semibold">Jenis Dokumen</th>
                  <th className="py-2 px-4 font-semibold">Status</th>
                  <th className="py-2 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-sm text-on-surface-variant">
                {recentSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-on-surface-variant">
                      Belum ada pengajuan masuk.
                    </td>
                  </tr>
                ) : (
                  recentSubmissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-on-surface">{submission.data.nama_pekerjaan || 'Tanpa Judul'}</div>
                        <div className="text-[12px]">{submission.respondentName}</div>
                      </td>
                      <td className="py-3 px-4">{DOCUMENT_TYPE_LABELS[submission.documentType]}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={submission.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link to={`/admin/submissions?id=${submission.id}`}>
                          <button className="bg-secondary text-on-secondary px-3 py-1.5 rounded hover:bg-on-secondary-fixed-variant transition-colors font-label-md text-[13px]">Detail</button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications / Secondary Actions (Span 1) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Notification Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-title-lg text-lg font-semibold text-on-surface flex items-center gap-2">
                <Key className="w-5 h-5 text-secondary" />
                Permintaan Akses Baru
              </h3>
              <span className="bg-error text-on-error font-code-sm text-[12px] px-2 py-0.5 rounded-full">2</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="p-3 bg-surface-bright border border-outline-variant rounded-lg flex items-start gap-3 hover:border-secondary transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center shrink-0">
                  <User className="text-on-surface-variant w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-label-md text-sm font-semibold text-on-surface">Budi (Dinas PU)</div>
                  <div className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">Meminta akses modul Responden.</div>
                </div>
                <button className="text-secondary hover:bg-secondary-container/20 p-1 rounded transition-colors">
                  <Check className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-3 bg-surface-bright border border-outline-variant rounded-lg flex items-start gap-3 hover:border-secondary transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center shrink-0">
                  <User className="text-on-surface-variant w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-label-md text-sm font-semibold text-on-surface">Admin PT. Cipta</div>
                  <div className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">Pendaftaran entitas perusahaan.</div>
                </div>
                <button className="text-secondary hover:bg-secondary-container/20 p-1 rounded transition-colors">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button className="w-full mt-4 py-2 border border-outline-variant rounded-lg text-on-surface-variant font-label-md text-sm hover:bg-surface-container transition-colors">Kelola Akses Pengguna</button>
          </div>

          {/* System Status Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
            <h3 className="font-title-lg text-lg font-semibold text-on-surface mb-2">Status Sistem</h3>
            <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-outline-variant">
              <div className="w-3 h-3 rounded-full bg-secondary-container ring-4 ring-secondary-fixed-dim"></div>
              <div className="flex-1">
                <div className="font-label-md text-sm font-semibold text-on-surface">Semua Layanan Normal</div>
                <div className="font-body-sm text-[12px] text-surface-tint">Uptime: 99.98% (30 hari terakhir)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
