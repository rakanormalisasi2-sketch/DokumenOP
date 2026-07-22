import { lazy } from "react";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { Skeleton } from "@/components/ui/skeleton";
import { GlobalErrorBoundary } from "@/lib/GlobalErrorBoundary";

// Pages (statically loaded — lightweight)
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import SystemFlowDocs from "./pages/SystemFlowDocs";

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminTemplateEditor = lazy(() => import('./pages/admin/AdminTemplateEditor'));
const AdminFields = lazy(() => import('./pages/admin/AdminFields'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));

// Admin Pages — lazy-loaded to keep initial bundle small
// xlsx is heavy (2+ MB): only needed on submissions route
// luckyexcel + SmartDocxEditor (html-to-docx) are heavy: only needed on templates route
// MassDocumentGenerator (xlsx) is heavy: only needed on kontrak route
const AdminSubmissions = lazy(() => import("./pages/admin/AdminSubmissions"));
const AdminTemplates = lazy(() => import("./pages/admin/AdminTemplates"));
const AdminContractDocs = lazy(() => import("./pages/admin/AdminContractDocs"));

// Respondent Pages
const RespondentDashboard = lazy(() => import('./pages/respondent/RespondentDashboard'));
const RespondentDokumenAwal = lazy(() => import('./pages/respondent/RespondentDokumenAwal'));
const RespondentDokumenAkhir = lazy(() => import('./pages/respondent/RespondentDokumenAkhir'));
const RespondentHistory = lazy(() => import('./pages/respondent/RespondentHistory'));
const TestEditorPage = lazy(() => import('./pages/TestEditorPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-on-surface-variant">Memuat halaman...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'respondent' }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/respondent'} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/system-docs" element={<SystemFlowDocs />} />
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={user?.role === 'admin' ? '/admin' : '/respondent'} replace />
            : <Login />
        }
      />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense></ProtectedRoute>} />
      <Route path="/admin/submissions" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<PageLoader />}><AdminSubmissions /></Suspense></ProtectedRoute>} />
      <Route path="/admin/templates" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<PageLoader />}><AdminTemplates /></Suspense></ProtectedRoute>} />
      <Route path="/admin/templates/:templateId/edit" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<PageLoader />}><AdminTemplateEditor /></Suspense></ProtectedRoute>} />
      <Route path="/admin/fields" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<PageLoader />}><AdminFields /></Suspense></ProtectedRoute>} />
      <Route path="/admin/kontrak" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<PageLoader />}><AdminContractDocs /></Suspense></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<PageLoader />}><AdminUsers /></Suspense></ProtectedRoute>} />

      {/* Respondent Routes */}
      <Route path="/respondent" element={<ProtectedRoute requiredRole="respondent"><Suspense fallback={<PageLoader />}><RespondentDashboard /></Suspense></ProtectedRoute>} />
      <Route path="/respondent/dokumen-awal" element={<ProtectedRoute requiredRole="respondent"><Suspense fallback={<PageLoader />}><RespondentDokumenAwal /></Suspense></ProtectedRoute>} />
      <Route path="/respondent/dokumen-akhir" element={<ProtectedRoute requiredRole="respondent"><Suspense fallback={<PageLoader />}><RespondentDokumenAkhir /></Suspense></ProtectedRoute>} />
      <Route path="/respondent/history" element={<ProtectedRoute requiredRole="respondent"><Suspense fallback={<PageLoader />}><RespondentHistory /></Suspense></ProtectedRoute>} />

      {/* Test Route */}
      <Route path="/test-editor" element={<Suspense fallback={<PageLoader />}><TestEditorPage /></Suspense>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;
