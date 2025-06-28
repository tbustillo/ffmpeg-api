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
]), (req, res) => {
  const video = req.files.video?.[0]?.path;
  const audio = req.files.audio?.[0]?.path;
  const captions = req.files.captions?.[0]?.path;
  const output = `/tmp/output-${Date.now()}.mp4`;

  if (!video || !audio || !captions) {
    return res.status(400).json({ error: 'Missing one or more required files.' });
  }

  const cmd = `ffmpeg -y -i "${video}" -i "${audio}" -vf "subtitles='${captions}'" -c:v libx264 -c:a aac -shortest "${output}"`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('FFmpeg Error:', stderr);
      return res.status(500).json({ error: 'FFmpeg failed', details: stderr });
    }

    res.sendFile(output, () => {
      [video, audio, captions, output].forEach(file => fs.unlink(file, () => {}));
    });
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`FFmpeg API running on port ${PORT}`);
});
