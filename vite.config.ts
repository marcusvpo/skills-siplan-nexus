import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // Carrega variáveis de ambiente

  return {
    server: {
      host: "::",
      port: 8080,
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
      'global': 'globalThis', // Corrige referências globais e tokens como __WS_TOKEN__
      'process.env': env, // Expõe variáveis de ambiente via import.meta.env
    },
  };
});
