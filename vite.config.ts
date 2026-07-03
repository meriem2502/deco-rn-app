import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [],
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          dashboard: path.resolve(__dirname, 'dashboard.html'),
          commandes: path.resolve(__dirname, 'commandes.html'),
          nouvelle: path.resolve(__dirname, 'nouvelle.html'),
          modifier: path.resolve(__dirname, 'modifier.html'),
          produits: path.resolve(__dirname, 'produits.html'),
          clientes: path.resolve(__dirname, 'clientes.html'),
          calendrier: path.resolve(__dirname, 'calendrier.html'),
          statistiques: path.resolve(__dirname, 'statistiques.html'),
          parametres: path.resolve(__dirname, 'parametres.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
