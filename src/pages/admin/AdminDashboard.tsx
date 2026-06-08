import { useData } from '@/contexts/DataContext';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { DOCUMENT_TYPE_LABELS } from '@/types';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const { submissions } = useData();

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'submitted' || s.status === 'review').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    revision: submissions.filter((s) => s.status === 'revision' || s.status === 'rejected').length,
  };

  const recentSubmissions = [...submissions]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const currentDate = format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id });

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-8">
        {/* Elegant Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-8 sm:p-10 shadow-lg">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="200" r="200" fill="currentColor"/>
              <circle cx="200" cy="200" r="150" fill="url(#paint0_linear)"/>
              <defs>
                <linearGradient id="paint0_linear" x1="50" y1="50" x2="350" y2="350" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" stopOpacity="0"/>
                  <stop offset="1" stopColor="white"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-slate-300 mb-4 text-sm font-medium tracking-wide">
              <Calendar className="w-4 h-4" />
              {currentDate}
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight mb-2">
              Selamat Datang, Admin PUSDAOP
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg mb-8">
              Sistem Pengelolaan Dokumen Operasi. Anda memiliki <span className="text-amber-400 font-semibold">{stats.pending} dokumen</span> yang memerlukan peninjauan hari ini.
            </p>
            
            <div className="flex gap-4">
              <Link to="/admin/submissions?status=pending">
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold border-0 shadow-md transition-transform active:scale-95">
                  Tinjau Dokumen
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Action-Oriented Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Dokumen</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 uppercase tracking-wider">Menunggu Review</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-200 bg-rose-50/50 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-700 uppercase tracking-wider">Perlu Revisi</p>
                <p className="text-3xl font-bold text-rose-600 mt-1">{stats.revision}</p>
              </div>
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Telah Disetujui</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clean Data List */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Aktivitas Pengajuan Terbaru</h2>
            <Link to="/admin/submissions" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {recentSubmissions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Belum ada pengajuan masuk.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <Link to={`/admin/submissions?id=${submission.id}`} className="font-semibold text-slate-800 hover:text-primary transition-colors text-base">
                          {submission.data.nama_pekerjaan || 'Dokumen Tanpa Judul'}
                        </Link>
                        <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-500">
                          <span className="font-medium text-slate-700">{submission.respondentName}</span>
                          <span>•</span>
                          <span>{DOCUMENT_TYPE_LABELS[submission.documentType]}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{format(new Date(submission.updatedAt), 'dd MMM yyyy, HH:mm', { locale: id })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center pl-14 sm:pl-0">
                      <StatusBadge status={submission.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
