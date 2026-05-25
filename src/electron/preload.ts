import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),
  },

  dialog: {
    openFile: (filters?: Electron.FileFilter[]) =>
      ipcRenderer.invoke("dialog:openFile", filters),

    saveFile: (defaultName?: string) =>
      ipcRenderer.invoke("dialog:saveFile", defaultName),
  },

  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      ...args: unknown[]
    ) => {
      callback(...args);
    };

    ipcRenderer.on(channel, listener);

    return () => {
      ipcRenderer.removeListener(channel, listener);
    };
  },
});
