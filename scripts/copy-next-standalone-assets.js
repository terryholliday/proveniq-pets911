const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
}

const projectRoot = path.resolve(__dirname, '..');

const staticSrc = path.join(projectRoot, '.next', 'static');
const staticDest = path.join(projectRoot, '.next', 'standalone', '.next', 'static');

const publicSrc = path.join(projectRoot, 'public');
const publicDest = path.join(projectRoot, '.next', 'standalone', 'public');

copyDir(staticSrc, staticDest);
copyDir(publicSrc, publicDest);

console.log('Copied Next.js standalone assets:', {
  static: { from: staticSrc, to: staticDest, exists: fs.existsSync(staticSrc) },
  public: { from: publicSrc, to: publicDest, exists: fs.existsSync(publicSrc) },
});

