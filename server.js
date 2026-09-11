const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3001;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Seyir Relay Server Calisiyor!');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.replace('/?', ''));
  const streamUrl = params.get('url');

  if (!streamUrl) {
    console.log('Hata: URL parametresi eksik.');
    ws.close();
    return;
  }

  console.log('Yayın aktarımı başlatıldı:', streamUrl);

  // FFmpeg ile yayını anlık MPEG-1 video ve MP2 ses formatına dönüştürüyoruz
  const ffmpeg = spawn('ffmpeg', [
    '-re',
    '-i', streamUrl,
    '-f', 'mpegts',
    '-codec:v', 'mpeg1video',
    '-b:v', '1500k',
    '-r', '30',
    '-s', '960x540', // Akıcı oynatma için optimize çözünürlük
    '-codec:a', 'mp2',
    '-b:a', '128k',
    '-ar', '44100',
    '-ac', '2',
    '-'
  ]);

  ffmpeg.stdout.on('data', (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  ffmpeg.stderr.on('data', (data) => {
    // FFmpeg logları (hata ayıklama gerekirse konsola basılabilir)
  });

  ws.on('close', () => {
    console.log('İstemci ayrıldı, FFmpeg durduruluyor.');
    ffmpeg.kill('SIGKILL');
  });

  ws.on('error', (err) => {
    console.error('WebSocket hatası:', err);
    ffmpeg.kill('SIGKILL');
  });
});

server.listen(PORT, () => {
  console.log(`Relay sunucusu ${PORT} portunda aktif!`);
});