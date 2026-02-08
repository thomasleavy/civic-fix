const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'client', 'dist', 'index.html');
const dest = path.join(__dirname, '..', 'client', 'dist', '404.html');
if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('Copied index.html to 404.html for GitHub Pages SPA fallback');
} else {
  console.error('Run "npm run build:client:gh" first so client/dist exists');
  process.exit(1);
}
