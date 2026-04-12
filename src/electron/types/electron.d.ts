export interface ElectronAPI {
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
  };
  dialog: {
    openFile: (
      filters?: { name: string; extensions: string[] }[],
    ) => Promise<Electron.OpenDialogReturnValue>;
    saveFile: (defaultName?: string) => Promise<Electron.SaveDialogReturnValue>;
  };
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  off: (channel: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
