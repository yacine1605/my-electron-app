import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PDFViewer } from "@react-pdf/renderer";

// Importation de l'icône de sauvegarde depuis lucide-react (installé avec shadcn)
import { Save } from "lucide-react";
import BpuTemplate from "./templates/BpuTemplate";

const PdfPreview: React.FC = () => {
  const [isGenerating] = useState(false);

  // Ces données proviendront de votre état global (Zustand/Redux) ou du composant DataMapper
  const projectData = {
    title: "Équipement Service Réanimation - CHU",
    items: [
      {
        reference: "MED-XYZ-01",
        designation: "Moniteur patient multiparamétrique",
        quantity: 5,
        unitPrice: 250000,
      },
      {
        reference: "MED-ABC-02",
        designation: "Pousse seringue électrique simple",
        quantity: 10,
        unitPrice: 85000,
      },
      {
        reference: "MED-DEF-03",
        designation: "Respirateur de réanimation",
        quantity: 2,
        unitPrice: 3500000,
      },
    ],
  };

  const handleSaveToHistory = async () => {
    // 1. Ici, on appelle l'API Electron (IPC) pour sauvegarder en base de données Drizzle
    // 2. On peut aussi déclencher l'exportation du fichier .pdf sur le disque local
    alert("Fichier sauvegardé dans l'historique locale !");
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Aperçu du BPU / DGE</CardTitle>
              <CardDescription>
                L'aperçu est généré en temps réel à partir des données validées.
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleSaveToHistory}
                disabled={isGenerating}
              >
                <Save className="mr-2 h-4 w-4" />
                Archiver
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Le composant PDFViewer occupe tout l'espace restant */}
      <div className="flex-1 rounded-lg border bg-white shadow-inner overflow-hidden min-h-150">
        {/*
          PDFViewer intègre la visionneuse native de Chromium.
          Attention : Il peut être lourd lors du hot-reload en développement.
        */}
        <PDFViewer
          width="100%"
          height="100%"
          showToolbar={true}
          style={{ border: "none" }}
        >
          <BpuTemplate
            projectTitle={projectData.title}
            items={projectData.items}
          />
        </PDFViewer>
      </div>
    </div>
  );
};

export default PdfPreview;
