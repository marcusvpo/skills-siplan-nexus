
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import SystemPage from "./pages/SystemPage";
import ProductPage from "./pages/ProductPage";
import ModulePage from "./pages/ModulePage";
import VideoLesson from "./pages/VideoLesson";
import AdminDashboard from "./pages/AdminDashboard";
import VideoAulaEditor from "./pages/VideoAulaEditor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/system/:systemId" element={<SystemPage />} />
            <Route path="/system/:systemId/product/:productId" element={<ProductPage />} />
            <Route path="/system/:systemId/product/:productId/module/:moduleId" element={<ModulePage />} />
            <Route path="/system/:systemId/product/:productId/lesson/:lessonId" element={<VideoLesson />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/video-aulas/nova" element={<VideoAulaEditor />} />
            <Route path="/admin/video-aulas/editar/:id" element={<VideoAulaEditor />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
