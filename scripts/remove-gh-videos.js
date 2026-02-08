const fs = require('fs');
const path = require('path');
const videosDir = path.join(__dirname, '..', 'client', 'dist', 'videos');
const files = ['landing-page-video.mp4', 'landing-page-video-2.mp4'];
if (fs.existsSync(videosDir)) {
  files.forEach((f) => {
    const p = path.join(videosDir, f);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('Removed', f, 'from deploy (GitHub 100 MB limit)');
    }
  });
}
