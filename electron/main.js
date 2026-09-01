const { app, BrowserWindow, shell } = require('electron');
const http = require('http');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;
const PORT = 0; // 0 => OS-assigned random port

// The exported web build is placed next to this file by the build-desktop script.
// In production it is packed inside app.asar.
function getDistPath() {
  return isDev ? path.join(__dirname, 'dist') : path.join(app.getAppPath(), 'dist');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

// Serve the exported web build over HTTP so wasm / web-workers / fonts load
// exactly like a normal web deployment (file:// breaks those in Chromium).
function startServer(distPath) {
  const server = http.createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent(req.url.split('?')[0]);
    } catch {
      urlPath = '/';
    }
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = path.join(distPath, urlPath);
    if (!filePath.startsWith(distPath)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });
}

let mainWindow = null;
let server = null;

async function createWindow() {
  const distPath = getDistPath();
  const port = await startServer(distPath);
  const url = `http://127.0.0.1:${port}/index.html`;

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 480,
    minHeight: 640,
    title: 'Blueprint',
    backgroundColor: '#0E121A',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Allow the renderer to reach the local server and nothing else.
  mainWindow.webContents.on('will-navigate', (e, targetUrl) => {
    if (!targetUrl.startsWith(`http://127.0.0.1:${port}`)) e.preventDefault();
  });

  await mainWindow.loadURL(url);

  // Open external links (e.g. YouTube exercise lookups) in the system browser.
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('http:') || targetUrl.startsWith('https:')) {
      shell.openExternal(targetUrl);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, failUrl) => {
    console.error(`Blueprint failed to load (${code}) ${desc}: ${failUrl}`);
  });

  mainWindow.webContents.on('console-message', (_e, details) => {
    const d = details && typeof details === 'object' ? details : { level: '', message: String(details) };
    console.log(`[renderer:${d.level}] ${d.message}`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const distPath = getDistPath();
  if (!fs.existsSync(path.join(distPath, 'index.html'))) {
    console.error(`Blueprint web build not found at ${distPath}. Run "npm run build:web" first.`);
    app.quit();
    return;
  }
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
