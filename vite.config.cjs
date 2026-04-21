const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    hmr: {
      clientPort: 443,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
      }
    }
  },
});
