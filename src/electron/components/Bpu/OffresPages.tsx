import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { useNavigate } from "react-router";
import { exportToPDF } from "./templates/exportTopdf";
interface SupplierFile {
  name: string; // fournisseur label
  fileName: string;
  base64: string; // PDF encoded
  size: number;
}

interface ComparisonResult {
  suppliers: {
    label: string;
    supplierName: string;
    score: number;
    totalPrice: number;
    currency: string;
    unitPrice: number;
    quantity: number;
    deliveryDays: number;
    warrantyMonths: number;
    certifications: string[];
    origin: string;
    strengths: string[];
    weaknesses: string[];
    products: {
      ref: string;
      designation: string;
      qty: number;
      unitPrice: number;
      total: number;
    }[];
  }[];
  winner: string;
  winnerReason: string;
  comparisonCriteria: {
    criterion: string;
    values: string[];
    bestIndex: number;
  }[];
  coherenceIssues: string[];
  recommendation: string;
}

const OffresPages = () => {
  let navigate = useNavigate();

  const [fournisseurs, setFournisseurs] = useState([
    "Fournissuer1",
    "Fournissuer2",
  ]);
  const [uploadedPDFs, setUploadedPDFs] = useState<
    Record<string, SupplierFile>
  >({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);
  const [lotPDFs, setLotPDFs] = useState<Record<string, SupplierFile>>({});
  const lot = "Lot1";
  const handleAddFournisseur = () => {
    const newFournisseur = `Fournissuer${fournisseurs.length + 1}`;
    setFournisseurs([...fournisseurs, newFournisseur]);
  };
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const addLog = (msg: string) =>
    setAnalysisProgress((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ]);
  // const handleImportPDF = (fournisseurName: string) => {
  //   // Ici, vous pouvez ajouter la logique pour importer un fichier PDF
  //   console.log(`Importer le PDF pour ${fournisseurName}`);
  //   // Exemple : ouvrir un sélecteur de fichiers
  //   const input = document.createElement("input");
  //   input.type = "file";
  //   input.accept = "application/pdf";
  //   input.onchange = (event) => {
  //     const file = (event.target as HTMLInputElement).files?.[0];
  //     if (file) {
  //       console.log(`Fichier sélectionné pour ${fournisseurName}:`, file.name);
  //       // Ajoutez ici la logique pour traiter le fichier
  //     }
  //   };
  //   input.click();
  // };
  const handleImportPDF = (fournisseurName: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      addLog(`Encodage de l'offre "${fournisseurName}" (${file.name})…`);
      const base64 = await fileToBase64(file);

      setUploadedPDFs((prev) => ({
        ...prev,
        [fournisseurName]: {
          name: fournisseurName,
          fileName: file.name,
          base64,
          size: file.size,
        },
      }));
      addLog(`✓ "${file.name}" prêt pour l'analyse`);
    };
    input.click();
  };
  // const handleImportPDFLot = (lot: string) => {
  //   // Ici, vous pouvez ajouter la logique pour importer un fichier PDF
  //   console.log(`Importer le PDF pour ${lot}`);
  //   // Exemple : ouvrir un sélecteur de fichiers
  //   const input = document.createElement("input");
  //   input.type = "file";
  //   input.accept = "application/pdf";
  //   input.onchange = (event) => {
  //     const file = (event.target as HTMLInputElement).files?.[0];
  //     if (file) {
  //       console.log(`Fichier sélectionné pour ${lot}:`, file.name);
  //       // Ajoutez ici la logique pour traiter le fichier
  //     }
  //   };
  //   input.click();
  // };
  const handleImportPDFLot = (lot: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const base64 = await fileToBase64(file);
      setLotPDFs((prev) => ({
        ...prev,
        [lot]: { name: lot, fileName: file.name, base64, size: file.size },
      }));
      addLog(`✓ Lot "${lot}" — "${file.name}" importé`);
    };
    input.click();
  };
  const handleCompare = async () => {
    const files = Object.values(uploadedPDFs);
    if (files.length < 2) {
      alert("Importez au moins 2 offres PDF pour lancer la comparaison.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress([]);
    setComparisonResult(null);

    try {
      addLog(`Démarrage comparaison — ${files.length} fournisseurs…`);

      // Build multi-document message content
      const contentParts: object[] = [];
      for (const f of files) {
        addLog(`Préparation: ${f.name} (${f.fileName})`);
        contentParts.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: f.base64,
          },
        });
        contentParts.push({
          type: "text",
          text: `Le document ci-dessus est l'offre du Fournisseur "${f.name}" (fichier: ${f.fileName}).`,
        });
      }

      contentParts.push({
        type: "text",
        text: `
Tu es expert en achats d'équipements médicaux pour FK PHARM (Algérie).
Compare ces ${files.length} offres fournisseurs et retourne UNIQUEMENT un objet JSON valide
(pas de markdown, pas de backticks) avec cette structure exacte :

{
  "suppliers": [
    {
      "label": "Fournisseur A",
      "supplierName": "Nom officiel extrait du PDF",
      "score": 85,
      "totalPrice": 1500000,
      "currency": "DZD",
      "unitPrice": 75000,
      "quantity": 20,
      "deliveryDays": 30,
      "warrantyMonths": 24,
      "certifications": ["CE", "ISO 9001"],
      "origin": "France",
      "strengths": ["Prix compétitif", "Délai court"],
      "weaknesses": ["Pas de SAV local"],
      "products": [
        { "ref": "REF001", "designation": "Nom produit", "qty": 20, "unitPrice": 75000, "total": 1500000 }
      ]
    }
  ],
  "winner": "Fournisseur A",
  "winnerReason": "Explication courte",
  "comparisonCriteria": [
    { "criterion": "Prix total HT", "values": ["1 500 000 DZD", "1 800 000 DZD"], "bestIndex": 0 },
    { "criterion": "Délai livraison", "values": ["30 jours", "45 jours"], "bestIndex": 0 },
    { "criterion": "Garantie", "values": ["24 mois", "12 mois"], "bestIndex": 0 },
    { "criterion": "Certifications", "values": ["CE, ISO 9001", "CE"], "bestIndex": 0 },
    { "criterion": "Origine", "values": ["France", "Chine"], "bestIndex": 0 }
  ],
  "coherenceIssues": [],
  "recommendation": "Recommandation détaillée en français avec justification technique et financière."
}

Les labels "Fournisseur A", "Fournisseur B"… doivent correspondre dans le même ordre
que les documents fournis : ${files.map((f, i) => `"Fournisseur ${String.fromCharCode(65 + i)}" = "${f.name}"`).join(", ")}.
`,
      });

      addLog("Envoi à l'API Claude (analyse IA en cours)…");

      const response = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: contentParts }],
        }),
      });

      const data = await response.json();
      const rawText: string = data.content
        .map((c: { text?: string }) => c.text ?? "")
        .join("");

      addLog("Réponse reçue — extraction JSON…");

      const start = rawText.indexOf("{");
      const end = rawText.lastIndexOf("}") + 1;
      const parsed: ComparisonResult = JSON.parse(rawText.slice(start, end));

      addLog(`✓ Analyse terminée — Gagnant: ${parsed.winner}`);
      setComparisonResult(parsed);
    } catch (err) {
      addLog(`Erreur: ${(err as Error).message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  const exportToCSV = () => {
    if (!comparisonResult) return;
    const { suppliers, comparisonCriteria, winner, recommendation } =
      comparisonResult;

    const rows: (string | number)[][] = [
      ["FK PHARM — Rapport de comparaison fournisseurs"],
      ["Date", new Date().toLocaleDateString("fr-FR")],
      ["Fournisseur recommandé", winner],
      [],
      ["SCORES"],
      [
        "Fournisseur",
        "Nom",
        "Score /100",
        "Prix Total",
        "Devise",
        "Délai (j)",
        "Garantie (mois)",
      ],
      ...suppliers.map((s) => [
        s.label,
        s.supplierName,
        s.score,
        s.totalPrice,
        s.currency,
        s.deliveryDays,
        s.warrantyMonths,
      ]),
      [],
      ["CRITÈRES DE COMPARAISON"],
      ["Critère", ...suppliers.map((s) => s.label), "Meilleur"],
      ...comparisonCriteria.map((c) => [
        c.criterion,
        ...c.values,
        suppliers[c.bestIndex]?.label ?? "—",
      ]),
      [],
      ["DÉTAIL PRODUITS — FOURNISSEUR RECOMMANDÉ"],
      ["Référence", "Désignation", "Quantité", "Prix Unitaire", "Total"],
      ...(
        suppliers.find((s) => s.label === winner || s.supplierName === winner)
          ?.products ?? []
      ).map((p) => [p.ref, p.designation, p.qty, p.unitPrice, p.total]),
      [],
      ["RECOMMANDATION IA"],
      [recommendation],
    ];

    const csv =
      "\uFEFF" +
      rows
        .map((r) =>
          r
            .map((c) => {
              const s = String(c ?? "").replace(/"/g, '""');
              return s.includes(",") || s.includes("\n") ? `"${s}"` : s;
            })
            .join(","),
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FK_PHARM_comparaison_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Fournisseur Proforma</CardTitle>
          <CardDescription>
            Importez 2 à 5 offres en même temps. Cette page permettra à
            l'utilisateur d'importer plusieurs offres de fournisseurs au format
            Excel, de les mapper pour extraire les données pertinentes, puis de
            les comparer côte à côte pour faciliter la sélection du meilleur
            fournisseur.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-row flex-wrap gap-4">
          {fournisseurs.map((fournisseur, index) => (
            <Card key={index}>
              <CardContent className="flex flex-col items-center justify-center h-full p-4">
                <Button
                  onClick={() => handleImportPDF(fournisseur)}
                  className="mb-2"
                >
                  Importer PDF pour {fournisseur}
                </Button>
                <span>{fournisseur}</span>
              </CardContent>
            </Card>
          ))}
        </CardContent>
        <div className="p-6">
          <Button
            variant="default"
            className="bg-red-100 w-max mb-4"
            onClick={handleAddFournisseur}
          >
            Ajouter un fournisseur
          </Button>
        </div>
        <CardFooter>
          <Button
            onClick={() => handleImportPDFLot(lot)}
            variant="default"
            className="bg-red-100"
          >
            Importer Cahier de charge ou Lot
          </Button>
        </CardFooter>
      </Card>
      <footer className="p-4 text-center text-sm text-gray-500">
        <Button
          className="w-full"
          disabled={Object.keys(uploadedPDFs).length < 2 || isAnalyzing}
          onClick={handleCompare}
        >
          {isAnalyzing ? "Analyse en cours…" : "Comparer avec l'IA →"}
        </Button>
        {/* progress log */}
        {analysisProgress.length > 0 && (
          <pre className="text-xs bg-muted p-3 rounded-md max-h-28 overflow-y-auto">
            {analysisProgress.join("\n")}
          </pre>
        )}
        {comparisonResult && (
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={exportToCSV}>
              Export CSV/Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => exportToPDF(comparisonResult)}
            >
              Export PDF
            </Button>
          </div>
        )}
        <Button onClick={() => navigate("/bpu/templates")}>Suivant</Button>
      </footer>
    </div>
  );
};

export default OffresPages;
