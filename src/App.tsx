
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProviderEnhanced } from '@/contexts/AuthContextEnhanced';
import { Toaster } from '@/components/ui/toaster';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import AdminLogin from '@/pages/AdminLogin';
import Dashboard from '@/pages/Dashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import SystemPage from '@/pages/SystemPage';
import ProductPage from '@/pages/ProductPage';
import VideoLesson from '@/pages/VideoLesson';
import VideoAulaEditor from '@/pages/VideoAulaEditor';
import VideoAulaEditorWYSIWYG from '@/pages/VideoAulaEditorWYSIWYG';
import NovaVideoaula from '@/pages/NovaVideoaula';
import NovaVideoaulaBunny from '@/pages/NovaVideoaulaBunny';
import EditarVideoaula from '@/pages/EditarVideoaula';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: (failureCount, error: any) => {
        // Não tentar novamente em caso de erro de autenticação
        if (error?.message?.includes('JWT') || error?.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: true, // Refetch quando a janela ganha foco
      refetchOnReconnect: true, // Refetch quando reconecta à internet
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProviderEnhanced>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/videoaula/nova" element={<NovaVideoaulaBunny />} />
            <Route path="/nova-videoaula-bunny" element={<NovaVideoaulaBunny />} />
            <Route path="/admin/videoaula/editar" element={<EditarVideoaula />} />
            <Route path="/admin/videoaula-editor" element={<VideoAulaEditorWYSIWYG />} />
            <Route path="/admin/videoaula-editor/:id" element={<VideoAulaEditorWYSIWYG />} />
            <Route path="/system/:systemId" element={<SystemPage />} />
            <Route path="/system/:systemId/product/:productId" element={<ProductPage />} />
            <Route path="/system/:systemId/product/:productId/lesson/:videoId" element={<VideoLesson />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProviderEnhanced>
    </QueryClientProvider>
  );
}

export default App;
