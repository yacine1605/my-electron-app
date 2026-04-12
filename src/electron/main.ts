import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    frame: false,
    titleBarStyle: "hidden",
    icon: path.join(__dirname, "../public/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.on("did-finish-load", () => {
      //  mainWindow?.webContents.openDevTools(); // 👈 open AFTER page loads
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    mainWindow.webContents.on("did-finish-load", () => {
      //  mainWindow?.webContents.openDevTools(); // 👈 open AFTER page loads
    });
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC Handlers
ipcMain.handle("window:minimize", () => mainWindow?.minimize());
ipcMain.handle("window:maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle("window:close", () => mainWindow?.close());

ipcMain.handle("dialog:openFile", async (_, filters) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openFile", "multiSelections"],
    filters: filters || [
      { name: "Documents", extensions: ["pdf", "xlsx", "xls", "csv"] },
      { name: "PDF", extensions: ["pdf"] },
      { name: "Excel", extensions: ["xlsx", "xls"] },
    ],
  });
  return result;
});

ipcMain.handle("dialog:saveFile", async (_, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultName,
    filters: [
      { name: "PDF", extensions: ["pdf"] },
      { name: "Excel", extensions: ["xlsx"] },
    ],
  });
  return result;
});
