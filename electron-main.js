import { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let tray;

function createTray() {
  try {
    // Try to load an icon. If fails, use an empty image (macOS supports it for title-only trays mostly, but better to have something)
    // Since this is ESM (module), we need to check imports. We imported 'nativeImage' incorrectly?
    // nativeImage is exported from 'electron'.
    // We should import it at the top.
    // For now, let's assume we can add it to the top import or use the global require if nodeIntegration is on? No, main process is node.

    // Correct implementation:
    // We need to update the import statement at line 1 first. Let's do that in a separate edit or rely on 'electron' import.
    // For this block, let's assume we fix the import next.

    let icon = nativeImage.createEmpty();
    // Try to use app icon if available
    try {
      const iconPath = path.join(__dirname, 'dist', 'icon.png');
      const image = nativeImage.createFromPath(iconPath);
      if (!image.isEmpty()) {
        icon = image.resize({ width: 16, height: 16 });
      }
    } catch (e) { }

    tray = new Tray(icon);
    tray.setTitle("That's It");
    tray.setToolTip("That's It Timer");

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Quit', type: 'normal', click: () => app.quit() }
    ]);
    tray.setContextMenu(contextMenu);

  } catch (e) {
    console.log('Tray creation setup error', e);
  }
}

function updateTrayTitle(title) {
  if (tray) {
    tray.setTitle(title);
  }
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    frame: true,
    transparent: true,
    fullscreen: false,
    alwaysOnTop: false,
    skipTaskbar: false,
    hasShadow: false,
    resizable: true,
    movable: true,
    minimizable: true,
    closable: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
    minimizable: true,
    focusable: true
  });

  mainWindow.show();
  // DevTools removed per user request
  // mainWindow.webContents.openDevTools({ mode: 'detach' });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    console.log('Running in DEVELOPMENT mode');
  } else {
    // In production, load the index.html from the dist folder
    // This assumes dist is a sibling of electron-main.js in the app bundle
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    console.log(`Running in PRODUCTION mode. Loading: ${indexPath}`);

    mainWindow.loadFile(indexPath).catch(e => {
      console.error('Failed to load index.html:', e);
    });
  }

  // --- IPC HANDLERS (Preserved from previous version) ---

  // Handle Tray Timer Updates
  ipcMain.on('update-timer', (event, timeString) => {
    updateTrayTitle(timeString);
  });

  // Listen for widget hover events
  ipcMain.on('widget-hover', (event, isHovering) => {
    if (mainWindow) {
      mainWindow.setIgnoreMouseEvents(!isHovering, { forward: true });
      // Identify if we are in "lock" mode or "idle" to decide if we force top
      // For now, hover effects on hidden/minimized main window might not be relevant if using Tray
      // but we keep logic to avoid breakage.
    }
  });

  createTray();

  // Safety timeout
  let reactAppLoaded = false;
  const safetyTimeout = setTimeout(() => {
    if (!reactAppLoaded && mainWindow && !mainWindow.isDestroyed()) {
      console.log('React app did not load, keeping window click-through for safety');
      mainWindow.setIgnoreMouseEvents(true, { forward: true });
    }
  }, 5000);

  // Set click through
  ipcMain.on('set-click-through', (event, shouldIgnore, status) => {
    console.log('set-click-through IPC received:', shouldIgnore, 'status:', status);
    reactAppLoaded = true;
    clearTimeout(safetyTimeout);
    if (mainWindow) {
      mainWindow.setIgnoreMouseEvents(shouldIgnore, { forward: true });
      if (shouldIgnore) {
        if (!mainWindow.isFullScreen()) {
          mainWindow.setFullScreen(true);
        }
        mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
        mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        mainWindow.setMovable(false);
        mainWindow.setResizable(false);
        mainWindow.show();
      } else {
        if (status === 'LOCKED') {
          console.log('LOCKED state - blocking all interaction');
          mainWindow._isLocked = true;
          if (!mainWindow.isFullScreen()) mainWindow.setFullScreen(true);

          mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
          mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
          mainWindow.setMovable(false);
          mainWindow.setResizable(false);
          mainWindow.setIgnoreMouseEvents(false, { forward: true });
          mainWindow.show();
          mainWindow.focus();
          app.focus({ steal: true });

          if (process.platform === 'darwin') {
            try { mainWindow.setKiosk(true); } catch (e) { }
          }

          // Locking interval
          const lockInterval = setInterval(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              // Only apply if needed
              if (!mainWindow.isAlwaysOnTop()) {
                mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
              }

              // Only ensure visibility if hidden
              if (!mainWindow.isVisible()) {
                mainWindow.show();
              }

              if (!mainWindow.isFullScreen()) {
                mainWindow.setFullScreen(true);
              }

              // macOS specific: check Kiosk mode
              if (process.platform === 'darwin') {
                // Electron doesn't have an isKiosk() method easily accessible on all versions effectively
                // but repeatedly setting it can be jarring. 
                // We will skip repeated setKiosk for now to reduce flicker, relying on fullscreen + AlwaysOnTop.
                // OR we can wrap it in try/catch and only do it occasionally or if we detect lost focus.
              }

              // Only steal focus if we don't have it
              if (!mainWindow.isFocused()) {
                app.focus({ steal: true });
                if (app.dock) app.dock.show();
                mainWindow.focus();
                mainWindow.moveTop();
              }
            } else {
              clearInterval(lockInterval);
            }
          }, 500); // Relaxed to 500ms to stop flickering

          if (!mainWindow._lockInterval) mainWindow._lockInterval = lockInterval;
        } else {
          // IDLE
          if (mainWindow && mainWindow._lockInterval) {
            clearInterval(mainWindow._lockInterval);
            mainWindow._lockInterval = null;
          }
          if (mainWindow) {
            mainWindow._isLocked = false;
            mainWindow.setKiosk(false);
            if (mainWindow.isFullScreen()) {
              mainWindow.setFullScreen(false);
              mainWindow.setSize(900, 700);
              mainWindow.center();
            }
            mainWindow.setAlwaysOnTop(false);
            mainWindow.setMovable(true);
            mainWindow.setResizable(true);
          }
        }
      }
    }
  });

  ipcMain.on('start-timer', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(true);
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
          mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
          mainWindow.setMovable(false);
          mainWindow.setResizable(false);
          mainWindow.show();
        }
      }, 500);
    }
  });

  ipcMain.on('stop-timer', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(false);
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setMovable(true);
      mainWindow.setResizable(true);
    }
  });

  // Intercept keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Check if locked
    if (mainWindow && mainWindow._isLocked) {
      if ((input.control || input.meta) && (input.key.toLowerCase() === 'q' || input.key.toLowerCase() === 'w')) {
        console.log('Blocked Quit/Close attempt while LOCKED');
        event.preventDefault();
      }
      return;
    }

    // Normal behavior when not locked
    if ((input.control || input.meta) && input.key.toLowerCase() === 'q') {
      event.preventDefault();
      app.quit();
    }
    if ((input.control || input.meta) && input.key.toLowerCase() === 'w') {
      event.preventDefault();
      if (mainWindow) mainWindow.close();
    }
  });

  // Cleanup
  mainWindow.on('closed', function () {
    clearTimeout(safetyTimeout);
    if (mainWindow && mainWindow._lockInterval) clearInterval(mainWindow._lockInterval);
    mainWindow = null;
    if (tray) tray.destroy(); // Cleanup tray
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Prevent quitting if locked
app.on('before-quit', (event) => {
  if (mainWindow && mainWindow._isLocked) {
    console.log('Prevented quit because app is LOCKED');
    event.preventDefault();
  }
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});
