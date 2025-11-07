import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProgressProvider } from '@/contexts/ProgressContext';
import { Toaster } from '@/components/ui/toaster';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import AdminLogin from '@/pages/AdminLogin';
import Dashboard from '@/pages/Dashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import SystemPage from '@/pages/SystemPage';
import ProductPage from '@/pages/ProductPage';
import VideoLesson from '@/pages/VideoLesson';
import VideoAulaEditorWYSIWYG from '@/pages/VideoAulaEditorWYSIWYG';
import NovaVideoaulaBunny from '@/pages/NovaVideoaulaBunny';
import EditarVideoaula from '@/pages/EditarVideoaula';
import Debug from '@/pages/Debug';
import NotFound from '@/pages/NotFound';
import { TrilhaPage } from '@/pages/TrilhaPage';
import { TrilhaLessonPage } from '@/pages/TrilhaLessonPage';
import { QuizPage } from '@/pages/QuizPage';
import { CertificacoesPage } from '@/pages/CertificacoesPage';
import { AuthProvider } from '@/contexts/AuthContextFixed';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ProgressProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/videoaula/nova" element={<NovaVideoaulaBunny />} />
              <Route path="/nova-videoaula-bunny" element={<NovaVideoaulaBunny />} />
              <Route path="/admin/videoaula/editar" element={<EditarVideoaula />} />
              <Route path="/admin/video-aulas/editar/:id" element={<EditarVideoaula />} />
              <Route path="/admin/videoaula-editor" element={<VideoAulaEditorWYSIWYG />} />
              <Route path="/admin/videoaula-editor/:id" element={<VideoAulaEditorWYSIWYG />} />
              <Route path="/system/:systemId" element={<SystemPage />} />
              <Route path="/system/:systemId/product/:productId" element={<ProductPage />} />
              <Route path="/system/:systemId/product/:productId/lesson/:videoId" element={<VideoLesson />} />
              <Route path="/trilha/inicio" element={<TrilhaPage />} />
              <Route path="/trilha/aula/:video_aula_id" element={<TrilhaLessonPage />} />
              <Route path="/quiz/:quiz_id" element={<QuizPage />} />
              <Route path="/certificacoes" element={<CertificacoesPage />} />
              <Route path="/debug" element={<Debug />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ProgressProvider>
        </AuthProvider>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;