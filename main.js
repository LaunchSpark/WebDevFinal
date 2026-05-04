const { app, BrowserWindow, dialog } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

let mainWindow;
let server;
let isQuitting = false;

function configureRuntimePaths() {
  if (!app.isPackaged) return;

  const userDataDir = app.getPath('userData');
  fs.mkdirSync(userDataDir, { recursive: true });

  process.env.DB_PATH = path.join(userDataDir, 'blockdraft.db');
  process.env.ENV_FILE = path.join(userDataDir, '.env');

  if (!fs.existsSync(process.env.ENV_FILE)) {
    fs.writeFileSync(process.env.ENV_FILE, '', 'utf8');
  }
}

function startServer() {
  configureRuntimePaths();

  const expressApp = require('./server/app');
  return new Promise((resolve, reject) => {
    server = http.createServer(expressApp);
    server.on('close', () => {
      if (!isQuitting) {
        dialog.showErrorBox('BlockDraft Stopped', 'The internal server stopped unexpectedly.');
        app.quit();
      }
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve(server.address().port);
    });
  });
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    title: 'BlockDraft',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    dialog.showErrorBox(
      'BlockDraft Failed to Load',
      `The desktop app could not load ${validatedURL}.\n\n${errorDescription} (${errorCode})`
    );
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);
}

async function boot() {
  try {
    const port = await startServer();
    createWindow(port);
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
    });
  } catch (err) {
    dialog.showErrorBox(
      'BlockDraft Failed to Start',
      `The internal server could not start.\n\n${err.message}`
    );
    app.quit();
  }
}

app.whenReady().then(boot);

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (server) {
    try {
      server.close();
    } catch {}
  }
});

process.on('uncaughtException', (err) => {
  dialog.showErrorBox('BlockDraft Crashed', err.stack || err.message);
  if (!isQuitting) app.quit();
});

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? (reason.stack || reason.message) : String(reason);
  dialog.showErrorBox('BlockDraft Error', message);
  if (!isQuitting) app.quit();
});
