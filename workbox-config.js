module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{html,js,css,json,png,jpg,jpeg,svg,webp,ico,woff,woff2}'
  ],
  swDest: 'dist/sw.js',
  clientsClaim: true,
  skipWaiting: true
};
