const fs = require('fs');
const path = require('path');
const videosDir = path.join(__dirname, '..', 'client', 'dist', 'videos');
// Remove large videos so gh-pages push stays under GitHub's 100 MB file limit.
// landing-page-video.mp4 is ~111 MB. To show your video on the live site: compress it to <100 MB, or host it elsewhere and set videoRemote in Home.tsx.
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
