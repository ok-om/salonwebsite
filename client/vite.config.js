import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function serveCustomAssetFolders() {
  return {
    name: 'serve-custom-asset-folders',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url.split('?')[0];
        const decodedUrl = decodeURIComponent(rawUrl);
        const prefixes = ['/3d model', '/video', '/hair-cut', '/backgrounds', '/extra', '/figures', '/logo', '/music'];
        for (const prefix of prefixes) {
          if (decodedUrl.startsWith(prefix)) {
            const relPath = decodedUrl.replace(prefix, '');
            const folder = prefix.slice(1);
            // Check public/folder first, then root folder
            let filePath = path.join(__dirname, 'public', folder, relPath);
            if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
              filePath = path.join(__dirname, folder, relPath);
            }
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap = {
                '.glb': 'model/gltf-binary',
                '.gltf': 'model/gltf+json',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.mp3': 'audio/mpeg',
              };
              res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
              return fs.createReadStream(filePath).pipe(res);
            }
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveCustomAssetFolders()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          motion: ['gsap', 'lenis'],
        },
      },
    },
  },
});
