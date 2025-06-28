const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: '/tmp' });

app.post('/merge', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
  { name: 'captions', maxCount: 1 },
]), async (req, res) => {
  try {
    const videoPath = req.files.video[0].path;
    const audioPath = req.files.audio[0].path;
    const captionsPath = req.files.captions[0].path;
    const outputPath = `/tmp/output-${Date.now()}.mp4`;

    const cmd = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -vf "subtitles='${captionsPath}'" -c:v libx264 -c:a aac -shortest "${outputPath}"`;

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error('FFmpeg Error:', stderr);
        return res.status(500).send({ error: 'FFmpeg failed', details: stderr });
      }

      res.sendFile(outputPath, () => {
        fs.unlink(videoPath, () => {});
        fs.unlink(audioPath, () => {});
        fs.unlink(captionsPath, () => {});
        fs.unlink(outputPath, () => {});
      });
    });
  } catch (e) {
    console.error('Server Error:', e);
    res.status(500).send({ error: 'Server error', details: e.message });
  }
});

app.get('/', (req, res) => res.send('FFmpeg Merge Server is running.'));

app.listen(process.env.PORT || 3000, () => {
  console.log('FFmpeg merge server running on port', process.env.PORT || 3000);
});
