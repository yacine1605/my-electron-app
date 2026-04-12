import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "../../../lib/utils";

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  className?: string;
}

export function FileUploader({
  onFilesSelected,
  selectedFiles,
  onRemoveFile,
  accept = {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
    "application/vnd.ms-excel": [".xls"],
  },
  maxFiles = 20,
  className,
}: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200",
          isDragActive
            ? "border-primary-500 bg-primary-50"
            : "border-surface-300 hover:border-primary-400 hover:bg-surface-50",
        )}
      >
        <input {...getInputProps()} />
        <Upload
          className={cn(
            "w-10 h-10 mx-auto mb-3",
            isDragActive ? "text-primary-500" : "text-gray-400",
          )}
        />
        {isDragActive ? (
          <p className="text-primary-600 font-medium">
            Déposez les fichiers ici...
          </p>
        ) : (
          <>
            <p className="text-gray-600 font-medium">
              Glissez-déposez vos fichiers ici
            </p>
            <p className="text-sm text-gray-400 mt-1">
              ou cliquez pour sélectionner (PDF, Excel)
            </p>
          </>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {selectedFiles.length} fichier(s) sélectionné(s)
          </p>
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between bg-surface-50 rounded-lg px-4 py-2.5 border border-surface-200"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRemoveFile(index)}
                className="p-1 rounded-md hover:bg-surface-200 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
