import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, FileJson, Plus, Upload, Zap } from "lucide-react";
import { useOfferStore } from "@/lib/hooks/useOffre";

interface SupplierProformaProps {
  onCompare?: (uploadedPDFs: Record<string, unknown>) => void;
  onNavigate?: (path: string) => void;
}

type MatchStatus = "match" | "partial" | "missing" | "conflict";

type ReferenceItem = {
  id: string;
  designation: string;
  quantity?: number;
  unit?: string;
};

type SupplierItem = {
  id: string;
  designation: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  totalPrice?: number;
  confidence?: number;
  page?: number;
};

type ProductMatch = {
  referenceItem: ReferenceItem;
  supplierItem: SupplierItem | null;
  compatibility: number;
  status: MatchStatus;
  reasons: string[];
};

type SupplierComparison = {
  supplierName: string;
  fileName: string;
  matches: ProductMatch[];
};

type ComparisonResponse = {
  suppliers: SupplierComparison[];
};

type BackendAttachmentMeta = {
  id?: string | number;
  url?: string;
  name?: string;
  size?: number;
};

function CompatibilityBadge({ value }: { value: number }) {
  let className = "bg-red-100 text-red-700";

  if (value >= 85) {
    className = "bg-green-100 text-green-700";
  } else if (value >= 60) {
    className = "bg-amber-100 text-amber-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${className}`}
    >
      {value}%
    </span>
  );
}

function StatusBadge({ status }: { status: MatchStatus }) {
  const config: Record<MatchStatus, string> = {
    match: "bg-green-100 text-green-700",
    partial: "bg-amber-100 text-amber-700",
    missing: "bg-red-100 text-red-700",
    conflict: "bg-orange-100 text-orange-700",
  };

  const labels: Record<MatchStatus, string> = {
    match: "Compatible",
    partial: "Partiel",
    missing: "Manquant",
    conflict: "Conflit",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${config[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default function SupplierProforma({
  onNavigate,
}: SupplierProformaProps) {
  const [fournisseurs, setFournisseurs] = useState<string[]>([
    "Fournisseur 1",
    "Fournisseur 2",
  ]);

  const [supplierFiles, setSupplierFiles] = useState<
    Record<string, File | null>
  >({});

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<boolean | null>(
    null,
  );
  const [comparisonData, setComparisonData] =
    useState<ComparisonResponse | null>(null);

  const [validatedMatches, setValidatedMatches] = useState<
    Record<string, boolean>
  >({});

  const { attachment, offerTitle, backendAttachment } = useOfferStore();

  const API_ORIGIN =
    import.meta.env.VITE_API_ORIGIN ?? "https://api.digitservz.dz";

  const backendAttachmentMeta =
    backendAttachment as BackendAttachmentMeta | null;

  const fileUrl = backendAttachmentMeta?.url
    ? `${API_ORIGIN}${backendAttachmentMeta.url}`
    : null;

  const uploadedCount = Object.values(supplierFiles).filter(Boolean).length;

  const validatedCount = Object.values(validatedMatches).filter(Boolean).length;

  const handleSupplierFileChange = (
    fournisseur: string,
    file: File | undefined,
  ) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Veuillez importer un fichier PDF.");
      return;
    }

    setSupplierFiles((prev) => ({
      ...prev,
      [fournisseur]: file,
    }));
  };

  const handleAddFournisseur = () => {
    setFournisseurs((prev) => [...prev, `Fournisseur ${prev.length + 1}`]);
  };

  const getMatchKey = (
    supplierName: string,
    match: ProductMatch,
    index: number,
  ) => {
    return `${supplierName}-${match.referenceItem.id}-${index}`;
  };

  const handleCompare = async () => {
    setValidatedMatches({});
    setComparisonData(null);
    setComparisonResult(null);

    if (uploadedCount < 2) {
      alert("Veuillez importer au moins deux offres fournisseurs.");
      return;
    }

    if (!attachment && !backendAttachmentMeta) {
      alert("Veuillez importer le cahier de charge ou le lot de référence.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisProgress([
        "Analyse en cours...",
        "Préparation des PDFs fournisseurs...",
      ]);

      const formData = new FormData();

      Object.entries(supplierFiles).forEach(([supplierName, file]) => {
        if (!file) return;

        formData.append("supplierNames", supplierName);
        formData.append("supplierFiles", file);
      });

      if (attachment instanceof File) {
        formData.append("referenceFile", attachment);
      }

      if (backendAttachmentMeta?.id) {
        formData.append(
          "backendAttachmentId",
          String(backendAttachmentMeta.id),
        );
      }

      if (backendAttachmentMeta?.url) {
        formData.append("backendAttachmentUrl", backendAttachmentMeta.url);
      }

      setAnalysisProgress((prev) => [
        ...prev,
        "Envoi des fichiers au serveur...",
        "OCR des PDFs multi-pages...",
        "Extraction des tableaux produits / prix / quantités...",
      ]);

      const response = await fetch(`${API_ORIGIN}/api/ai/compare-proformas`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur pendant l'analyse OCR/IA.");
      }

      const data = (await response.json()) as ComparisonResponse;

      if (!data.suppliers || !Array.isArray(data.suppliers)) {
        throw new Error("Réponse backend invalide.");
      }

      setAnalysisProgress((prev) => [
        ...prev,
        "Comparaison avec le cahier de charge...",
        "Calcul des pourcentages de compatibilité...",
        "Analyse complétée.",
      ]);

      setComparisonData(data);
      setComparisonResult(true);
    } catch (error) {
      console.error(error);

      setAnalysisProgress((prev) => [
        ...prev,
        "Erreur pendant l'analyse. Veuillez vérifier les fichiers.",
      ]);

      alert("Erreur pendant l'analyse OCR/IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getValidatedPayload = () => {
    if (!comparisonData) return null;

    const suppliers = comparisonData.suppliers
      .map((supplier) => ({
        ...supplier,
        matches: supplier.matches.filter((match, index) => {
          const key = getMatchKey(supplier.supplierName, match, index);
          return validatedMatches[key];
        }),
      }))
      .filter((supplier) => supplier.matches.length > 0);

    return {
      offerTitle,
      generatedAt: new Date().toISOString(),
      suppliers,
    };
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();

    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = async () => {
    const payload = getValidatedPayload();

    if (!payload || payload.suppliers.length === 0) {
      alert("Veuillez valider au moins une ligne avant l'export.");
      return;
    }

    const response = await fetch(`${API_ORIGIN}/api/exports/comparison-excel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      alert("Erreur pendant l'export Excel.");
      return;
    }

    const blob = await response.blob();
    downloadBlob(blob, "comparaison-fournisseurs.xlsx");
  };

  const exportToPDF = async () => {
    const payload = getValidatedPayload();

    if (!payload || payload.suppliers.length === 0) {
      alert("Veuillez valider au moins une ligne avant l'export.");
      return;
    }

    const response = await fetch(`${API_ORIGIN}/api/exports/comparison-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      alert("Erreur pendant l'export PDF.");
      return;
    }

    const blob = await response.blob();
    downloadBlob(blob, "comparaison-fournisseurs.pdf");
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) onNavigate(path);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-slate-50 to-blue-50 p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
          {offerTitle && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                Offre
              </span>
              <span className="text-xs text-slate-400">#import</span>
            </div>
          )}

          <h1 className="text-4xl font-bold text-slate-900">
            {offerTitle || "Fournisseur Proforma"}
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-linear-to-r from-blue-50 to-slate-50">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Upload className="h-5 w-5 text-blue-600" />
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
                <div className="grid gap-4 sm:grid-cols-2">
                  {fournisseurs.map((fournisseur, index) => {
                    const file = supplierFiles[fournisseur];

                    return (
                      <Card
                        key={`${fournisseur}-${index}`}
                        className={`border-2 transition-all ${
                          file
                            ? "border-green-300 bg-green-50"
                            : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                          <div
                            className={`rounded-lg p-3 ${
                              file ? "bg-green-100" : "bg-slate-100"
                            }`}
                          >
                            <Upload
                              className={`h-6 w-6 ${
                                file ? "text-green-600" : "text-slate-400"
                              }`}
                            />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {fournisseur}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {file ? "Importé ✓" : "En attente"}
                            </p>

                            {file && (
                              <p className="mt-1 max-w-55 truncate text-xs text-slate-500">
                                {file.name}
                              </p>
                            )}
                          </div>

                          <input
                            id={`file-${fournisseur}`}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(event) =>
                              handleSupplierFileChange(
                                fournisseur,
                                event.target.files?.[0],
                              )
                            }
                          />

                          <Button
                            onClick={() =>
                              document
                                .getElementById(`file-${fournisseur}`)
                                ?.click()
                            }
                            variant={file ? "outline" : "default"}
                            className="w-full"
                          >
                            {file ? "Remplacer PDF" : "Importer PDF"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Button
                  onClick={handleAddFournisseur}
                  variant="outline"
                  className="mt-6 w-full border-2 border-dashed"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un fournisseur
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-linear-to-r from-amber-50 to-slate-50">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-100 p-2">
                    <BookOpen className="h-5 w-5 text-amber-600" />
                  </div>

                  <div>
                    <CardTitle>Cahier de Charge ou Lot</CardTitle>
                    <CardDescription>
                      Document de référence pour la comparaison
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {attachment || backendAttachmentMeta ? (
                  <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 p-4">
                    <div className="rounded-lg bg-green-100 p-2">
                      <BookOpen className="h-5 w-5 text-green-600" />
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold text-green-800">
                        {backendAttachmentMeta?.name ?? attachment?.name}
                      </p>

                      <p className="mt-1 text-sm text-green-600">
                        {(
                          (backendAttachmentMeta?.size ??
                            attachment?.size ??
                            0) /
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
                  <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
                    Aucune pièce jointe — complétez d'abord l'étape 4 de l'offre
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-blue-100">
                      Statut d'importation
                    </p>
                    <p className="mt-2 text-3xl font-bold">{uploadedCount}</p>
                    <p className="mt-1 text-sm text-blue-100">
                      fournisseurs prêts
                    </p>
                  </div>

                  <div className="h-2 w-full rounded-full bg-blue-400">
                    <div
                      className="h-full rounded-full bg-white transition-all"
                      style={{
                        width: `${
                          (uploadedCount / Math.max(fournisseurs.length, 2)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Comparaison IA/OCR</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                <Button
                  onClick={handleCompare}
                  disabled={uploadedCount < 2 || isAnalyzing}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="mr-2 animate-spin">⚙️</span>
                      Analyse en cours…
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Comparer les offres
                    </>
                  )}
                </Button>

                {uploadedCount < 2 && (
                  <p className="text-center text-xs text-slate-500">
                    Importez au moins 2 fournisseurs pour continuer
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 bg-slate-50 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Processus
                  </h4>

                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex gap-2">
                      <span className="font-bold text-blue-600">1</span>
                      <span>Importer les PDFs fournisseurs</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-blue-600">2</span>
                      <span>Extraire les tableaux par OCR/IA</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-blue-600">3</span>
                      <span>Comparer avec le cahier de charge</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-blue-600">4</span>
                      <span>Valider avant export PDF/Excel</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {(analysisProgress.length > 0 || comparisonResult) && (
          <div className="space-y-6">
            {analysisProgress.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">Journal d'analyse</CardTitle>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg bg-slate-900 p-4 font-mono text-sm text-slate-100">
                    {analysisProgress.map((log, index) => (
                      <div key={`${log}-${index}`} className="text-slate-300">
                        <span className="text-green-400">{">"}</span> {log}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {comparisonData && (
              <Card className="border-0 border-t-4 border-t-green-500 shadow-lg">
                <CardHeader className="border-b bg-green-50">
                  <CardTitle className="text-lg text-green-900">
                    Résultats de la comparaison
                  </CardTitle>
                  <CardDescription>
                    Validez les produits compatibles avant d'exporter
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 p-6">
                  {comparisonData.suppliers.map((supplier) => (
                    <Card
                      key={supplier.supplierName}
                      className="border shadow-sm"
                    >
                      <CardHeader>
                        <CardTitle className="text-base">
                          {supplier.supplierName}
                        </CardTitle>
                        <CardDescription>{supplier.fileName}</CardDescription>
                      </CardHeader>

                      <CardContent className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="border-b bg-slate-50">
                              <th className="min-w-60 p-3 text-left">
                                Produit demandé
                              </th>
                              <th className="min-w-70 p-3 text-left">
                                Données extraites OCR/IA
                              </th>
                              <th className="p-3 text-left">Qté</th>
                              <th className="p-3 text-left">PU</th>
                              <th className="p-3 text-left">Total</th>
                              <th className="p-3 text-left">Compatibilité</th>
                              <th className="p-3 text-left">Statut</th>
                              <th className="p-3 text-left">Validation</th>
                            </tr>
                          </thead>

                          <tbody>
                            {supplier.matches.map((match, index) => {
                              const key = getMatchKey(
                                supplier.supplierName,
                                match,
                                index,
                              );

                              const canValidate =
                                Boolean(match.supplierItem) &&
                                match.compatibility >= 50;

                              return (
                                <tr
                                  key={key}
                                  className="border-b align-top hover:bg-slate-50"
                                >
                                  <td className="p-3">
                                    <p className="font-medium text-slate-900">
                                      {match.referenceItem.designation}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                      Qté demandée :{" "}
                                      {match.referenceItem.quantity ?? "-"}{" "}
                                      {match.referenceItem.unit ?? ""}
                                    </p>
                                  </td>

                                  <td className="p-3">
                                    {match.supplierItem ? (
                                      <>
                                        <p className="font-medium text-slate-800">
                                          {match.supplierItem.designation}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                          Page :{" "}
                                          {match.supplierItem.page ?? "-"} |
                                          Confiance OCR :{" "}
                                          {match.supplierItem.confidence ?? "-"}
                                          %
                                        </p>

                                        {match.reasons.length > 0 && (
                                          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-500">
                                            {match.reasons.map(
                                              (reason, reasonIndex) => (
                                                <li
                                                  key={`${reason}-${reasonIndex}`}
                                                >
                                                  {reason}
                                                </li>
                                              ),
                                            )}
                                          </ul>
                                        )}
                                      </>
                                    ) : (
                                      <span className="font-medium text-red-600">
                                        Produit non trouvé
                                      </span>
                                    )}
                                  </td>

                                  <td className="p-3">
                                    {match.supplierItem?.quantity ?? "-"}{" "}
                                    {match.supplierItem?.unit ?? ""}
                                  </td>

                                  <td className="p-3">
                                    {match.supplierItem?.unitPrice != null
                                      ? `${match.supplierItem.unitPrice.toLocaleString()} DA`
                                      : "-"}
                                  </td>

                                  <td className="p-3">
                                    {match.supplierItem?.totalPrice != null
                                      ? `${match.supplierItem.totalPrice.toLocaleString()} DA`
                                      : "-"}
                                  </td>

                                  <td className="p-3">
                                    <CompatibilityBadge
                                      value={match.compatibility}
                                    />
                                  </td>

                                  <td className="p-3">
                                    <StatusBadge status={match.status} />
                                  </td>

                                  <td className="p-3">
                                    <input
                                      type="checkbox"
                                      checked={validatedMatches[key] ?? false}
                                      disabled={!canValidate}
                                      onChange={(event) => {
                                        setValidatedMatches((prev) => ({
                                          ...prev,
                                          [key]: event.target.checked,
                                        }));
                                      }}
                                      className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>

                <CardFooter className="flex flex-col gap-3 border-t pt-6">
                  {validatedCount === 0 && (
                    <p className="w-full text-center text-sm text-amber-600">
                      Veuillez valider au moins une correspondance produit pour
                      continuer.
                    </p>
                  )}

                  {validatedCount > 0 && (
                    <p className="w-full text-center text-sm text-green-700">
                      {validatedCount} ligne(s) validée(s).
                    </p>
                  )}

                  <div className="flex w-full flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={exportToExcel}
                      variant="outline"
                      className="flex-1"
                      disabled={validatedCount === 0}
                    >
                      <FileJson className="mr-2 h-4 w-4" />
                      Export Excel
                    </Button>

                    <Button
                      onClick={exportToPDF}
                      variant="outline"
                      className="flex-1"
                      disabled={validatedCount === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export PDF
                    </Button>
                  </div>

                  <Button
                    onClick={() => handleNavigate("/bpu/templates")}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    size="lg"
                    disabled={validatedCount === 0}
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
