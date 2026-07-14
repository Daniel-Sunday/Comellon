const { generateSW } = require('workbox-build');

generateSW({
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{html,js,css,json,png,jpg,jpeg,svg,webp,ico,woff,woff2}'
  ],
  swDest: 'dist/sw.js',
  clientsClaim: true,
  skipWaiting: true
}).then(({ count, size }) => {
  console.log(`Generated service worker: cached ${count} files, totaling ${size} bytes.`);
}).catch((err) => {
  console.error('Failed to generate service worker:', err);
  process.exit(1);
});
