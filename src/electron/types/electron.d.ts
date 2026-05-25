export {};

type FileFilter = {
  name: string;
  extensions: string[];
};

type OpenDialogReturnValue = {
  canceled: boolean;
  filePaths: string[];
};

type SaveDialogReturnValue = {
  canceled: boolean;
  filePath?: string;
};

declare global {
  interface Window {
    electronAPI: {
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
      };

      dialog: {
        openFile: (
          filters?: FileFilter[],
        ) => Promise<OpenDialogReturnValue | null>;

        saveFile: (
          defaultName?: string,
        ) => Promise<SaveDialogReturnValue | null>;
      };
    };
  }
}
