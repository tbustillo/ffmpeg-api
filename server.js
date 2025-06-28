const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: '/tmp' });

// Health check route for Render deployment validation
app.get('/', (req, res) => {
  res.send('FFmpeg API is up and running.');
});

app.post('/merge', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
  { name: 'captions', maxCount: 1 },
]), async (req, res) => {
  const cleanupFiles = [];

  try {
    const videoPath = req.files.video[0].path;
    const audioPath = req.files.audio[0].path;
    const captionsPath = req.files.captions[0].path;
    const outputPath = `/tmp/output-${Date.now()}.mp4`;

    cleanupFiles.push(videoPath, audioPath, captionsPath, outputPath);

    // Determine subtitle filter based on extension
    const ext = path.extname(captionsPath).toLowerCase();
    const subtitleFilter = ext === '.ass'
      ? `ass='${captionsPath}'`
      : `subtitles='${captionsPath}'`;

    const cmd = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -vf "${subtitleFilter}" -c:v libx264 -c:a aac -shortest "${outputPath}"`;

    console.log('Running FFmpeg command:', cmd);

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error('FFmpeg stderr:', stderr);
        return res.status(500).send({ error: 'FFmpeg failed', details: stderr });
      }

      console.log('FFmpeg stdout:', stdout);

      res.sendFile(outputPath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
        }

        // Cleanup all temporary files
        cleanupFiles.forEach(file => fs.unlink(file, () => {}));
      });
    });

  } catch (e) {
    console.error('Server error:', e);
    // Cleanup on server error
    cleanupFiles.forEach(file => fs.unlink(file, () => {}));
    res.status(500).send({ error: 'Server error', details: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FFmpeg server running on port ${PORT}`);
});
