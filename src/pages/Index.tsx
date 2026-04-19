import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Shield,
  Clock,
  Zap,
  ArrowRight,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Kelola Dokumen',
    description: 'Buat dan kelola dokumen KAK, Surat Perintah, BAPHP, dan BAST dengan mudah',
  },
  {
    icon: Shield,
    title: 'Aman & Terkontrol',
    description: 'Sistem approval berlapis dengan tracking status real-time',
  },
  {
    icon: Clock,
    title: 'Efisien',
    description: 'Mail merge otomatis dari template ke dokumen final',
  },
  {
    icon: Zap,
    title: 'Cepat & Mudah',
    description: 'Antarmuka intuitif untuk pengisian dan review dokumen',
  },
];

const benefits = [
  'Template dokumen yang dapat dikustomisasi',
  'Placeholder otomatis untuk mail merge',
  'Tracking status pengajuan real-time',
  'Koreksi dan feedback dari admin',
  'Cetak dokumen yang telah disetujui',
  'Export data ke format Excel',
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-xl">DocMS</span>
            </div>
            <Link to="/login">
              <Button>Masuk</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-primary-foreground leading-tight animate-fade-in">
              Sistem Manajemen
              <br />
              <span className="text-primary-foreground/80">Dokumen Kontrak</span>
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/70 max-w-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Kelola pembuatan KAK, Surat Perintah, BAPHP, dan BAST dengan sistem yang terintegrasi.
              Dari pengisian form hingga cetak dokumen final.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/login">
                <Button variant="hero" size="xl" className="gap-2">
                  Mulai Sekarang
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/system-docs">
                <Button variant="outline" size="xl" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2">
                  <BookOpen className="w-5 h-5" />
                  Lihat Alur Sistem
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">
              Fitur Unggulan
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Solusi lengkap untuk manajemen dokumen kontrak Anda
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 bg-card rounded-2xl shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
                Mengapa Memilih DocMS?
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Sistem yang dirancang khusus untuk mempermudah proses administrasi dokumen kontrak dengan fitur lengkap dan mudah digunakan.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-elevated p-8">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <FileText className="w-16 h-16 text-muted-foreground" />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary">100+</p>
                  <p className="text-sm text-muted-foreground">Dokumen/bulan</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">4</p>
                  <p className="text-sm text-muted-foreground">Tipe Template</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">24/7</p>
                  <p className="text-sm text-muted-foreground">Akses Online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="gradient-hero rounded-3xl p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground mb-4">
              Siap Memulai?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Mulai kelola dokumen kontrak Anda dengan lebih efisien dan terstruktur
            </p>
            <Link to="/login">
              <Button variant="secondary" size="xl" className="gap-2">
                Masuk ke Sistem
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading font-semibold">DocMS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Document Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
