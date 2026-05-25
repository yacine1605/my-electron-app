import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Zap, Download, FileJson, BookOpen } from "lucide-react";
import { useOfferStore } from "@/lib/hooks/useOffre";
import OffresPages from "@/layouts/BpuLayout";

interface SupplierProformaProps {
  onCompare?: (uploadedPDFs: Record<string, unknown>) => void;
  onNavigate?: (path: string) => void;
}

export default function SupplierProforma({
  onNavigate,
}: SupplierProformaProps) {
  const [fournisseurs, setFournisseurs] = useState<string[]>([
    "Fournisseur 1",
    "Fournisseur 2",
  ]);
  const [uploadedPDFs, setUploadedPDFs] = useState<Record<string, boolean>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<boolean | null>(
    null,
  );
  const { attachment, offerTitle, backendAttachment } = useOfferStore();
  const [approvedItems, setApprovedItems] = useState<string[]>([]);

  const handleImportPDF = (fournisseur: string) => {
    setUploadedPDFs((prev) => ({ ...prev, [fournisseur]: true }));
  };

  const handleAddFournisseur = () => {
    setFournisseurs((prev) => [...prev, `Fournisseur ${prev.length + 1}`]);
  };

  //const handleImportPDFLot = () => {
  //  setAnalysisProgress(["Lot imported successfully"]);
  //};
  const API_ORIGIN =
    import.meta.env.VITE_API_ORIGIN ?? "https://api.digitservz.dz";

  const fileUrl = backendAttachment?.url
    ? `${API_ORIGIN}${backendAttachment.url}`
    : null;
  const handleCompare = () => {
    setApprovedItems([]); // ← reset

    setIsAnalyzing(true);
    setAnalysisProgress(["Analyse en cours...", "Extraction des données..."]);
    setTimeout(() => {
      setAnalysisProgress([
        "Analyse en cours...",
        "Extraction des données...",
        "Comparaison...",
        "Complétée!",
      ]);
      setComparisonResult(true);
      setIsAnalyzing(false);
    }, 2000);
  };

  const exportToCSV = () => {
    console.log("Export CSV");
  };

  const exportToPDF = () => {
    console.log("Export PDF");
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) onNavigate(path);
  };

  const uploadedCount = Object.values(uploadedPDFs).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          {offerTitle && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                Offre
              </span>
              <span className="text-xs text-slate-400">#import</span>
            </div>
          )}
          <h1 className="text-4xl font-bold text-slate-900">
            {offerTitle || "Fournisseur Proforma"}
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Import Documents */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Cards Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-linear-to-r from-blue-50 to-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Offres Fournisseurs</CardTitle>
                    <CardDescription>
                      {uploadedCount}/{Math.max(fournisseurs.length, 2)} offres
                      importées
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {fournisseurs.map((fournisseur, index) => (
                    <Card
                      key={index}
                      className={`border-2 transition-all ${
                        uploadedPDFs[fournisseur]
                          ? "border-green-300 bg-green-50"
                          : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                        <div
                          className={`p-3 rounded-lg ${
                            uploadedPDFs[fournisseur]
                              ? "bg-green-100"
                              : "bg-slate-100"
                          }`}
                        >
                          <Upload
                            className={`w-6 h-6 ${
                              uploadedPDFs[fournisseur]
                                ? "text-green-600"
                                : "text-slate-400"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {fournisseur}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {uploadedPDFs[fournisseur]
                              ? "Importé ✓"
                              : "En attente"}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleImportPDF(fournisseur)}
                          variant={
                            uploadedPDFs[fournisseur] ? "outline" : "default"
                          }
                          className="w-full"
                          disabled={uploadedPDFs[fournisseur]}
                        >
                          {uploadedPDFs[fournisseur]
                            ? "Importé"
                            : "Importer PDF"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button
                  onClick={handleAddFournisseur}
                  variant="outline"
                  className="w-full mt-6 border-dashed border-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un fournisseur
                </Button>
              </CardContent>
            </Card>

            {/* Specifications Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-linear-to-r from-amber-50 to-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle>Cahier de Charge ou Lot</CardTitle>
                    <CardDescription>
                      Importez les spécifications de référence
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {attachment || backendAttachment ? (
                  <div className="rounded-lg border border-green-300 bg-green-50 p-4 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BookOpen className="w-5 h-5 text-green-600" />
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold text-green-800">
                        {backendAttachment?.name ?? attachment?.name}
                      </p>

                      <p className="text-sm text-green-600 mt-1">
                        {(
                          (backendAttachment?.size ?? attachment?.size ?? 0) /
                          1024 /
                          1024
                        ).toFixed(2)}{" "}
                        MB — Chargé automatiquement ✓
                      </p>

                      {fileUrl && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
                        >
                          Ouvrir le fichier
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-gray-200 h-24 flex items-center justify-center text-sm text-gray-400">
                    Aucune pièce jointe — complétez d'abord l'étape 4 de l'offre
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="border-0 shadow-lg bg-linear-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      Statut d&apos;importation
                    </p>
                    <p className="text-3xl font-bold mt-2">{uploadedCount}</p>
                    <p className="text-blue-100 text-sm mt-1">
                      fournisseurs prêts
                    </p>
                  </div>
                  <div className="w-full bg-blue-400 rounded-full h-2">
                    <div
                      className="bg-white h-full rounded-full transition-all"
                      style={{
                        width: `${(uploadedCount / Math.max(fournisseurs.length, 2)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparison Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Comparaison IA</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Button
                  onClick={handleCompare}
                  disabled={uploadedCount < 2 || isAnalyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="animate-spin mr-2">⚙️</span>
                      Analyse en cours…
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Comparer les offres
                    </>
                  )}
                </Button>

                {uploadedCount < 2 && (
                  <p className="text-xs text-slate-500 text-center">
                    Importez au moins 2 fournisseurs pour continuer
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-0 shadow-lg bg-slate-50">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 text-sm">
                    À propos du processus
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-bold">1</span>
                      <span>Importez les offres</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-bold">2</span>
                      <span>Ajoutez les spécifications</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-bold">3</span>
                      <span>Lancez la comparaison</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Analysis Progress & Results */}
        {(analysisProgress.length > 0 || comparisonResult) && (
          <div className="space-y-6">
            {analysisProgress.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">
                    Journal d&apos;analyse
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm space-y-2 max-h-48 overflow-y-auto">
                    {analysisProgress.map((log, i) => (
                      <div key={i} className="text-slate-300">
                        <span className="text-green-400">{">"}</span> {log}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {comparisonResult === true && (
              <Card className="border-0 shadow-lg border-t-4 border-t-green-500">
                <CardHeader className="border-b bg-green-50">
                  <CardTitle className="text-lg text-green-900">
                    Résultats de la comparaison
                  </CardTitle>
                  <CardDescription>
                    Validez les correspondances avant d'exporter
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                  {/* ✅ Étape 1 : Validation des items */}
                  <OffresPages
                    onValidationComplete={(approved) =>
                      setApprovedItems(approved)
                    }
                  />
                </CardContent>

                {/* ✅ Étape 2 : Export — débloqué seulement si au moins 1 item approuvé */}
                <CardFooter className="border-t pt-6 flex flex-col gap-3">
                  {approvedItems.length === 0 && (
                    <p className="text-sm text-amber-600 text-center w-full">
                      Veuillez valider au moins un produit pour continuer.
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button
                      onClick={exportToCSV}
                      variant="outline"
                      className="flex-1"
                      disabled={approvedItems.length === 0}
                    >
                      <FileJson className="w-4 h-4 mr-2" />
                      Export CSV/Excel
                    </Button>
                    <Button
                      onClick={exportToPDF}
                      variant="outline"
                      className="flex-1"
                      disabled={approvedItems.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>

                  <Button
                    onClick={() => handleNavigate("/bpu/templates")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                    disabled={approvedItems.length === 0}
                  >
                    Suivant →
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
