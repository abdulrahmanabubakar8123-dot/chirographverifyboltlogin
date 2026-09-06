import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// GitHub Pages is a static host: a direct request for /dashboard (or any
// client-side route) has no matching file and returns 404. Serving a copy of
// index.html as 404.html lets the SPA bootstrap and let React Router handle the
// deep link. Generating it at build time (instead of relying on a workflow
// shell command) guarantees dist/404.html always exists and references the
// correct hashed assets.
function githubPagesSpaFallback() {
  return {
    name: 'github-pages-spa-fallback',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const indexPath = resolve('dist/index.html');
      const notFoundPath = resolve('dist/404.html');
      writeFileSync(notFoundPath, readFileSync(indexPath));
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_URL || 'https://app.chirographverify.com';

  return {
    // GitHub Pages serves the site from the repository sub-path
    // https://<user>.github.io/chirographverifyboltlogin/
    base: '/',
    plugins: [react(), githubPagesSpaFallback()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
