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
  { name: 'captions', maxCount: 1 }
]), (req, res) => {
  const videoPath = req.files.video[0].path;
  const audioPath = req.files.audio[0].path;
  const captionsPath = req.files.captions[0].path;
  const outputPath = `/tmp/output-${Date.now()}.mp4`;

  const cmd = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -vf "ass='${captionsPath}'" -c:v libx264 -c:a aac -shortest "${outputPath}"`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('FFmpeg error:', stderr);
      return res.status(500).json({ error: 'FFmpeg failed', stderr });
    }

    res.sendFile(outputPath, err => {
      [videoPath, audioPath, captionsPath, outputPath].forEach(file => {
        fs.unlink(file, () => {});
      });
    });
  });
});

app.get('/', (req, res) => res.send('FFmpeg API is up!'));

app.listen(process.env.PORT || 3000, () => {
  console.log('FFmpeg API running on port', process.env.PORT || 3000);
});
