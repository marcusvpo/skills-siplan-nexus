
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import AdminLogin from '@/pages/AdminLogin';
import Dashboard from '@/pages/Dashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import SystemPage from '@/pages/SystemPage';
import ProductPage from '@/pages/ProductPage';
import ModulePage from '@/pages/ModulePage';
import VideoLesson from '@/pages/VideoLesson';
import VideoAulaEditor from '@/pages/VideoAulaEditor';
import VideoAulaEditorWYSIWYG from '@/pages/VideoAulaEditorWYSIWYG';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/videoaula-editor" element={<VideoAulaEditorWYSIWYG />} />
            <Route path="/admin/videoaula-editor/:id" element={<VideoAulaEditorWYSIWYG />} />
            <Route path="/sistema/:sistemaId" element={<SystemPage />} />
            <Route path="/produto/:produtoId" element={<ProductPage />} />
            <Route path="/modulo/:moduloId" element={<ModulePage />} />
            <Route path="/video/:videoId" element={<VideoLesson />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
