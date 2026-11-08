const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig(({ mode }) => ({
  plugins: [react()],
  // En production, retire les console.log/debug (ils affichaient des données clients dans la console)
  esbuild: mode === 'production' ? { pure: ['console.log', 'console.debug'] } : undefined,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
      }
    }
  },
}));
