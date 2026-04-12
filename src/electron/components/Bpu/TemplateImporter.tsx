// TemplateImporter.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TemplateImporter = ({ onNext }: { onNext: () => void }) => {
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // Logique Electron pour lire le fichier modèle (BPU/DGE Excel ou Word)
    // IPC Renderer -> Main process (Node.js fs)
  };

  return (
    <Card
      className="border-dashed border-2 hover:border-blue-400 transition-colors cursor-pointer"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
    >
      <CardHeader>
        <CardTitle>Importer le modèle BPU / DGE</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <svg
          className="w-12 h-12 text-slate-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-sm text-slate-500 mb-4">
          Glissez-déposez votre fichier modèle ici (Excel, Word, ou PDF)
        </p>
        <Button onClick={onNext}>Utiliser le modèle par défaut</Button>
      </CardContent>
    </Card>
  );
};

export default TemplateImporter;
