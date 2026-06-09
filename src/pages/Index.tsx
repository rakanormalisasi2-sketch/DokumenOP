import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Shield,
  ArrowRight,
  ShieldCheck,
  Network,
  ClipboardCheck,
  Printer,
  HelpCircle
} from 'lucide-react';

export default function Index() {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      {/* TopNavBar */}
      <header className="bg-surface-container-lowest border-b border-outline-variant docked full-width top-0 sticky z-40 flex justify-between items-center w-full px-4 md:px-8 h-16">
        <div className="flex items-center gap-4">
          <span className="font-title-lg text-title-lg font-black text-primary">PUSDAOP</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a className="font-label-md text-label-md text-secondary font-bold border-b-2 border-secondary pb-1" href="#">Beranda</a>
          <Link className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors" to="/system-docs">Prosedur</Link>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors" href="#">Regulasi</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors" href="#">Kontak</a>
        </nav>

        <div className="flex items-center gap-4">
          <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <HelpCircle className="w-5 h-5" />
          </button>
          <Link to="/login">
            <button className="font-label-md text-label-md bg-secondary text-on-secondary px-6 py-2 rounded hover:bg-secondary/90 transition-colors">
              Masuk Portal
            </button>
          </Link>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-surface w-full py-16 md:py-[80px] overflow-hidden border-b border-outline-variant">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 bg-secondary-container/20 text-secondary font-label-md text-label-md px-3 py-1 rounded-full w-max">
                <ShieldCheck className="w-4 h-4" />
                Sistem Resmi Pemerintah
              </div>
              <h1 className="font-display-lg text-4xl md:text-5xl lg:text-[48px] font-bold text-primary leading-tight">
                Portal Operasi Dokumen Pemerintah
              </h1>
              <p className="font-body-lg text-lg text-on-surface-variant max-w-xl">
                Sistem manajemen administrasi kontrak pekerjaan umum yang efisien, transparan, dan terintegrasi untuk mempercepat birokrasi.
              </p>
              
              <div className="flex flex-wrap gap-4 mt-4">
                <Link to="/login">
                  <button className="font-label-md text-label-md bg-primary text-on-primary px-8 py-4 rounded shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
                    Masuk ke Portal
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <Link to="/system-docs">
                  <button className="font-label-md text-label-md bg-surface-container-lowest text-primary border border-outline-variant px-8 py-4 rounded hover:bg-surface-container-low transition-colors flex items-center gap-2">
                    <Network className="w-5 h-5" />
                    Lihat Alur Sistem
                  </button>
                </Link>
              </div>
            </div>
            
            <div className="hidden md:block relative h-[400px] w-full rounded-xl overflow-hidden border border-outline-variant bg-surface-container-lowest shadow-sm">
              <img 
                alt="Dashboard Preview" 
                className="object-cover w-full h-full opacity-90" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGm7qYHchX5EY-9_ttEXhN-XYCpKzP0bVoIP_FxOqb1TfyXkywuSs5vNyLNvLS57qu3F0rpzMXBEb8CrM4Ih5eMsnxkMQVmiYN16lfudN14Ls6WFhgvijyP2q1E3V0TQS1vBW6t8TD0tAg1qSD46yaVjQudaol2CpMGtD0DcivkiaVAeHSTrbDo3O3w_hAQ-eHg9t_bb2v71xSM9OdUSoINWJMubOgpcLdKUqc6orDt4-uCvYIbJ760Tj-9bxuTILLfXeFB8KUEQ"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/50 to-transparent"></div>
            </div>
          </div>
          
          {/* Decorative background pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(#091426 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        </section>

        {/* Features Bento Grid */}
        <section className="py-20 bg-background">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="font-headline-lg text-3xl font-bold text-primary mb-2">Fitur Utama Platform</h2>
              <p className="font-body-md text-on-surface-variant max-w-2xl mx-auto">Dirancang khusus untuk memenuhi standar operasional administrasi pemerintah modern.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="col-span-1 md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col justify-between hover:border-secondary/30 transition-colors group">
                <div>
                  <div className="w-12 h-12 bg-secondary-fixed rounded-lg flex items-center justify-center mb-6 text-secondary">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h3 className="font-title-lg text-xl font-bold text-primary mb-2">Pengajuan Dokumen Digital</h3>
                  <p className="font-body-md text-on-surface-variant">Unggah dan kelola berkas administrasi kontrak pekerjaan umum secara terpusat tanpa perlu dokumen fisik.</p>
                </div>
              </div>
              
              {/* Feature 2 */}
              <div className="col-span-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col justify-between hover:border-secondary/30 transition-colors group">
                <div>
                  <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center mb-6 text-primary">
                    <ClipboardCheck className="w-7 h-7" />
                  </div>
                  <h3 className="font-title-lg text-xl font-bold text-primary mb-2">Verifikasi Real-time</h3>
                  <p className="font-body-md text-on-surface-variant">Pantau status persetujuan dokumen dengan notifikasi instan pada setiap tahapan.</p>
                </div>
              </div>
              
              {/* Feature 3 */}
              <div className="col-span-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col justify-between hover:border-secondary/30 transition-colors group">
                <div>
                  <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center mb-6 text-primary">
                    <Printer className="w-7 h-7" />
                  </div>
                  <h3 className="font-title-lg text-xl font-bold text-primary mb-2">Cetak Otomatis</h3>
                  <p className="font-body-md text-on-surface-variant">Hasilkan dokumen resmi berformat standar dengan fitur Mail Merge yang terintegrasi langsung dengan database.</p>
                </div>
              </div>
              
              {/* Feature 4 */}
              <div className="col-span-1 md:col-span-2 bg-primary text-on-primary border border-primary-container rounded-xl p-8 flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center mb-6 text-secondary-fixed">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h3 className="font-title-lg text-xl font-bold text-on-primary mb-2">Keamanan Data Terpusat</h3>
                  <p className="font-body-md text-primary-fixed-dim">Infrastruktur server pemerintah dengan enkripsi end-to-end, memastikan kerahasiaan dan integritas data proyek nasional.</p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
                  <Shield className="w-[200px] h-[200px]" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-on-primary font-body-sm text-sm w-full py-12 px-8 flex flex-col items-center justify-center space-y-6 border-t border-primary-container">
        <div className="font-label-md text-base font-bold text-on-primary">PUSDAOP</div>
        <div className="flex flex-wrap justify-center gap-6">
          <a className="text-surface-variant opacity-80 hover:opacity-100 transition-opacity" href="#">Kebijakan Privasi</a>
          <a className="text-surface-variant opacity-80 hover:opacity-100 transition-opacity" href="#">Syarat &amp; Ketentuan</a>
          <a className="text-surface-variant opacity-80 hover:opacity-100 transition-opacity" href="#">Peta Situs</a>
          <a className="text-surface-variant opacity-80 hover:opacity-100 transition-opacity" href="#">Hubungi Kami</a>
        </div>
        <p className="text-surface-variant opacity-80 mt-8 text-center">© 2024 PUSDAOP - Portal Operasi Dokumen Pemerintah. Seluruh Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}
