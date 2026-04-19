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

// Pages (statically loaded — lightweight)
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import SystemFlowDocs from "./pages/SystemFlowDocs";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTemplateEditor from "./pages/admin/AdminTemplateEditor";
import AdminFields from "./pages/admin/AdminFields";
import AdminUsers from "./pages/admin/AdminUsers";

// Admin Pages — lazy-loaded to keep initial bundle small
// xlsx is heavy (2+ MB): only needed on submissions route
// luckyexcel + SmartDocxEditor (html-to-docx) are heavy: only needed on templates route
// MassDocumentGenerator (xlsx) is heavy: only needed on kontrak route
const AdminSubmissions = lazy(() => import("./pages/admin/AdminSubmissions"));
const AdminTemplates = lazy(() => import("./pages/admin/AdminTemplates"));
const AdminContractDocs = lazy(() => import("./pages/admin/AdminContractDocs"));

// Respondent Pages
import RespondentDashboard from "./pages/respondent/RespondentDashboard";
import RespondentDokumenAwal from "./pages/respondent/RespondentDokumenAwal";
import RespondentDokumenAkhir from "./pages/respondent/RespondentDokumenAkhir";
import RespondentHistory from "./pages/respondent/RespondentHistory";
import TestEditorPage from "./pages/TestEditorPage";

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
  const { isAuthenticated, user } = useAuth();

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
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/submissions" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Skeleton className="w-64 h-8" /></div>}><AdminSubmissions /></Suspense></ProtectedRoute>} />
      <Route path="/admin/templates" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Skeleton className="w-64 h-8" /></div>}><AdminTemplates /></Suspense></ProtectedRoute>} />
      <Route path="/admin/templates/:templateId/edit" element={<ProtectedRoute requiredRole="admin"><AdminTemplateEditor /></ProtectedRoute>} />
      <Route path="/admin/fields" element={<ProtectedRoute requiredRole="admin"><AdminFields /></ProtectedRoute>} />
      <Route path="/admin/kontrak" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Skeleton className="w-64 h-8" /></div>}><AdminContractDocs /></Suspense></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />

      {/* Respondent Routes */}
      <Route path="/respondent" element={<ProtectedRoute requiredRole="respondent"><RespondentDashboard /></ProtectedRoute>} />
      <Route path="/respondent/dokumen-awal" element={<ProtectedRoute requiredRole="respondent"><RespondentDokumenAwal /></ProtectedRoute>} />
      <Route path="/respondent/dokumen-akhir" element={<ProtectedRoute requiredRole="respondent"><RespondentDokumenAkhir /></ProtectedRoute>} />
      <Route path="/respondent/history" element={<ProtectedRoute requiredRole="respondent"><RespondentHistory /></ProtectedRoute>} />

      {/* Test Route */}
      <Route path="/test-editor" element={<TestEditorPage />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
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
);

export default App;
