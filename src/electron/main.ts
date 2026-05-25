import { app, BrowserWindow, dialog, ipcMain } from "electron";
import fs from "fs";
import path from "path";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const preloadPath = path.join(__dirname, "preload.js");

  console.log("Preload path:", preloadPath);
  console.log("Preload exists:", fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    frame: false,
    icon: path.join(__dirname, "../public/icon.png"),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);

    mainWindow.webContents.once("did-finish-load", () => {
      mainWindow?.webContents.openDevTools();
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * Window controls
 */
ipcMain.handle("window:minimize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.minimize();
});

ipcMain.handle("window:maximize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  if (!win) return;

  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.handle("window:close", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.close();
});

/**
 * Dialogs
 */
ipcMain.handle(
  "dialog:openFile",
  async (_, filters?: Electron.FileFilter[]) => {
    if (!mainWindow) return null;

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile", "multiSelections"],
      filters: filters || [
        {
          name: "Documents",
          extensions: ["pdf", "xlsx", "xls", "csv"],
        },
        {
          name: "PDF",
          extensions: ["pdf"],
        },
        {
          name: "Excel",
          extensions: ["xlsx", "xls"],
        },
      ],
    });

    return result;
  },
);

ipcMain.handle("dialog:saveFile", async (_, defaultName?: string) => {
  if (!mainWindow) return null;

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      {
        name: "PDF",
        extensions: ["pdf"],
      },
      {
        name: "Excel",
        extensions: ["xlsx"],
      },
    ],
  });

  return result;
});
