import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // Carrega variáveis de ambiente

  return {
    server: {
      host: true, // Escuta em todas as interfaces
      port: 8080,
      hmr: {
        protocol: 'ws', // Força WebSocket sem token customizado
        host: 'localhost', // Ajuste para o host local se necessário
      },
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      sourcemap: true, // Ativa source maps para depuração
    },
    define: {
      'global': 'globalThis', // Corrige referências globais
      'process.env': env, // Expõe variáveis de ambiente
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis', // Reforça para esbuild
        },
      },
    },
  };
});
