import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  Notification,
  shell
} from 'electron';
import * as path from 'path';
import { BleService } from './bluetooth/bleService';
import { registerMessagingIpc } from './ipc/messagingBridge';
import { DatabaseService } from './database/dbService';

declare global {
  namespace NodeJS {
    interface Global {
      isQuiting: boolean;
    }
  }
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let bleService: BleService | null = null;
let dbService: DatabaseService | null = null;
let isQuiting = false;

const isDev = process.env.NODE_ENV === 'development';

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: true,
    backgroundColor: '#0f0f0f',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const url = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '..', 'dist', 'index.html')}`;

  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (mainWindow) {
      dbService = new DatabaseService();
      bleService = new BleService(mainWindow, dbService);
      registerMessagingIpc(mainWindow, bleService, dbService);
    }
  });

  mainWindow.on('close', (e) => {
    if (!isQuiting) {
      e.preventDefault();
      mainWindow?.hide();
      if (Notification.isSupported()) {
        new Notification({
          title: 'Crisis Connect',
          body: 'Uygulama arka planda calismaya devam ediyor.'
        }).show();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function createTray(): void {
  const iconPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');
  let icon: Electron.NativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath);
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);

  const buildMenu = () =>
    Menu.buildFromTemplate([
      {
        label: 'Crisis Connect Desktop',
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Aç / Goster',
        click: () => {
          if (!mainWindow) createWindow();
          else {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Bluetooth Tarama',
        click: () => {
          bleService?.startScan();
        }
      },
      { type: 'separator' },
      {
        label: 'GitHub',
        click: () =>
          shell.openExternal(
            'https://github.com/emirhan-duman/Crisis-Connect'
          )
      },
      { type: 'separator' },
      {
        label: 'Cikis',
        click: () => {
          isQuiting = true;
          bleService?.destroy();
          dbService?.close();
          app.quit();
        }
      }
    ]);

  tray.setToolTip('Crisis Connect Desktop');
  tray.setContextMenu(buildMenu());

  tray.on('double-click', () => {
    if (!mainWindow) createWindow();
    else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Windows/Linux: tray'de yasam, tamamen kapatma
  // Darwin: standart davranis
  if (process.platform === 'darwin') app.quit();
});

app.on('before-quit', () => {
  isQuiting = true;
});

process.on('uncaughtException', (err) => {
  console.error('[Main] Uncaught exception:', err);
});
