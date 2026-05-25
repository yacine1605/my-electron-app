import { useMemo, useState } from "react";

type BestSupplier = {
  supplierName: string | null;
  supplierFile: string | null;
  offeredDesignation: string | null;
  compatibilityPercentage: number;
  unitPriceHT: number | null;
  totalPriceHT: number | null;
  reason: string;
};

type ExportRow = {
  n: number;
  requestedProduct: string;
  requiredCharacteristics: string;
  bestSupplier: string | null;
  offeredProduct: string | null;
  compatibilityPercentage: number;
  unitPriceHT: number | null;
  totalPriceHT: number | null;
  tva: number | null;
  status: string;
  remarks: string;
};

type ProductNeedingValidation = {
  requestedProductId: string;
  requestedDesignation: string;
  reason: string;
  compatibilityPercentage: number;
  marketSearchQuery: string;
  suggestedSuppliers: Array<{
    companyName: string | null;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    source: string | null;
    confidence: number;
  }>;
};

type FullComparisonResponse = {
  lotInfo: {
    lotNumber: string | null;
    title: string | null;
    sourceFiles: string[];
  };
  comparison: Array<{
    requestedProductId: string;
    requestedDesignation: string;
    requiredCharacteristics: string[];
    bestSupplier: BestSupplier | null;
    status: "matched" | "weak_match" | "not_found";
    globalCompatibilityPercentage: number;
    needsMarketSearch: boolean;
    marketSearchQuery: string | null;
  }>;
  productsNeedingValidation: ProductNeedingValidation[];
  summary: {
    totalRequestedProducts: number;
    totalMatchedProducts: number;
    totalWeakMatches: number;
    totalNotFound: number;
    recommendedSuppliers: Array<{
      supplierName: string;
      numberOfBestOffers: number;
      totalAmountHT: number | null;
      averageCompatibility: number;
    }>;
    globalBestSupplier: {
      supplierName: string | null;
      reason: string;
    } | null;
  };
  exportRows: ExportRow[];
};

const API_BASE_URL = "https://api.digitservz.dz/api";

export default function SupplierProforma() {
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [supplierFiles, setSupplierFiles] = useState<File[]>([]);
  const [result, setResult] = useState<FullComparisonResponse | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canAnalyze =
    referenceFiles.length > 0 && supplierFiles.length > 0 && !isAnalyzing;

  const totalRecommendedHT = useMemo(() => {
    if (!result) return 0;

    return result.exportRows.reduce((sum, row) => {
      return sum + (row.totalPriceHT ?? 0);
    }, 0);
  }, [result]);

  function handleReferenceFilesChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []).filter((file) => {
      return file.type === "application/pdf";
    });

    setReferenceFiles(files);
    setResult(null);
    setErrorMessage(null);
  }

  function handleSupplierFilesChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []).filter((file) => {
      return file.type === "application/pdf";
    });

    setSupplierFiles(files);
    setResult(null);
    setErrorMessage(null);
  }

  function buildFormData() {
    const formData = new FormData();

    referenceFiles.forEach((file) => {
      formData.append("referenceFiles", file);
    });

    supplierFiles.forEach((file) => {
      formData.append("supplierFiles", file);
    });

    return formData;
  }

  async function analyzeFiles() {
    if (!canAnalyze) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/compare-proformas`, {
        method: "POST",
        body: buildFormData(),
      });

      if (!response.ok) {
        const message = await getErrorMessage(response);
        throw new Error(message);
      }

      const data = (await response.json()) as FullComparisonResponse;
      setResult(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function exportExcelFromBackend() {
    if (referenceFiles.length === 0 || supplierFiles.length === 0) {
      setErrorMessage("Veuillez sélectionner les fichiers avant l'export.");
      return;
    }

    setIsExportingExcel(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/compare-proformas/excel`, {
        method: "POST",
        body: buildFormData(),
      });

      if (!response.ok) {
        const message = await getErrorMessage(response);
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "comparaison-fournisseurs.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erreur pendant l'export Excel.",
      );
    } finally {
      setIsExportingExcel(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UploadPanel
              referenceFiles={referenceFiles}
              supplierFiles={supplierFiles}
              onReferenceFilesChange={handleReferenceFilesChange}
              onSupplierFilesChange={handleSupplierFilesChange}
            />
          </div>

          <ActionPanel
            canAnalyze={canAnalyze}
            isAnalyzing={isAnalyzing}
            isExportingExcel={isExportingExcel}
            result={result}
            onAnalyze={analyzeFiles}
            onExportExcel={exportExcelFromBackend}
          />
        </section>

        {errorMessage && <ErrorAlert message={errorMessage} />}

        {result && (
          <>
            <SummarySection
              result={result}
              totalRecommendedHT={totalRecommendedHT}
            />

            <ComparisonTable rows={result.exportRows} />

            {result.summary.recommendedSuppliers.length > 0 && (
              <RecommendedSuppliers result={result} />
            )}

            {result.productsNeedingValidation.length > 0 && (
              <ValidationSection products={result.productsNeedingValidation} />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function UploadPanel(props: {
  referenceFiles: File[];
  supplierFiles: File[];
  onReferenceFilesChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSupplierFilesChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-6 md:grid-cols-2">
        <FileInputCard
          title="Cahier des charges / Lot"
          description="Ajoutez le PDF du lot ou plusieurs pages de référence."
          inputId="reference-files"
          files={props.referenceFiles}
          multiple
          onChange={props.onReferenceFilesChange}
          icon="📄"
        />

        <FileInputCard
          title="Proformas fournisseurs"
          description="Ajoutez les proformas PDF. Le nom du fournisseur sera détecté automatiquement par l'IA."
          inputId="supplier-files"
          files={props.supplierFiles}
          multiple
          onChange={props.onSupplierFilesChange}
          icon="🏢"
        />
      </div>
    </section>
  );
}

function FileInputCard(props: {
  title: string;
  description: string;
  inputId: string;
  files: File[];
  multiple?: boolean;
  icon: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-emerald-500 hover:bg-emerald-50/40">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
          {props.icon}
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">{props.title}</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {props.description}
          </p>
        </div>
      </div>

      <label
        htmlFor={props.inputId}
        className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center shadow-sm transition hover:border-emerald-500"
      >
        <span className="text-sm font-semibold text-emerald-700">
          Cliquez pour sélectionner
        </span>
        <span className="mt-1 text-xs text-slate-500">
          PDF uniquement, plusieurs fichiers acceptés
        </span>
      </label>

      <input
        id={props.inputId}
        type="file"
        accept="application/pdf"
        multiple={props.multiple}
        onChange={props.onChange}
        className="hidden"
      />

      {props.files.length > 0 && (
        <div className="mt-4 space-y-2">
          {props.files.map((file, index) => {
            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm shadow-sm"
              >
                <span className="truncate text-slate-700">{file.name}</span>
                <span className="shrink-0 text-xs text-slate-400">
                  {formatFileSize(file.size)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActionPanel(props: {
  canAnalyze: boolean;
  isAnalyzing: boolean;
  isExportingExcel: boolean;
  result: FullComparisonResponse | null;
  onAnalyze: () => void;
  onExportExcel: () => void;
}) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Actions</h2>
      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={props.onAnalyze}
          disabled={!props.canAnalyze}
          className="flex w-full items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {props.isAnalyzing ? "Analyse en cours..." : "Analyser les PDF"}
        </button>

        <button
          type="button"
          onClick={props.onExportExcel}
          disabled={props.isExportingExcel}
          className="flex w-full items-center justify-center rounded-xl border border-emerald-700 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
        >
          {props.isExportingExcel
            ? "Génération Excel..."
            : "Exporter Excel modèle"}
        </button>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">Statut</p>

        <div className="mt-3 space-y-2 text-sm text-slate-500">
          <StatusLine
            label="Référence"
            valid={props.canAnalyze || props.result !== null}
          />
          <StatusLine
            label="Proformas"
            valid={props.canAnalyze || props.result !== null}
          />
          <StatusLine label="Analyse" valid={props.result !== null} />
        </div>
      </div>
    </aside>
  );
}

function SummarySection(props: {
  result: FullComparisonResponse;
  totalRecommendedHT: number;
}) {
  return (
    <section className="space-y-5">
      <div className="rounded-3xl border max-w-max border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Lot</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {props.result.lotInfo.lotNumber ?? "Lot non détecté"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {props.result.lotInfo.title ?? "Titre non détecté"}
            </p>
          </div>
        </div>

        {props.result.lotInfo.sourceFiles.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">
              Fichiers de référence détectés
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {props.result.lotInfo.sourceFiles.map((file, index) => {
                return (
                  <span
                    key={`${file}-${index}`}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm"
                  >
                    {file}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ComparisonTable(props: { rows: ExportRow[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Tableau de comparaison
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Vue détaillée des produits et des offres retenues.
          </p>
        </div>
      </div>

      <div className="mt-6 max-h-72 overflow-y-auto overflow-x-auto rounded-xl border border-slate-100">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="border-b border-slate-200 px-3 py-3">#</th>
              <th className="border-b border-slate-200 px-3 py-3">
                Produit demandé
              </th>
              <th className="border-b border-slate-200 px-3 py-3">
                Caractéristiques
              </th>
              <th className="border-b border-slate-200 px-3 py-3">Compat.</th>
              <th className="border-b border-slate-200 px-3 py-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {props.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-10 text-center text-sm text-slate-500"
                >
                  Aucun résultat à afficher.
                </td>
              </tr>
            ) : (
              props.rows.map((row) => (
                <tr
                  key={`${row.n}-${row.requestedProduct}`}
                  className="align-top text-sm"
                >
                  <td className="border-b border-slate-100 px-3 py-4 text-slate-500">
                    {row.n}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-4 font-medium text-slate-900">
                    {row.requestedProduct}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-4 text-slate-600">
                    {row.requiredCharacteristics}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-4">
                    {row.compatibilityPercentage}%
                  </td>
                  <td className="border-b border-slate-100 px-3 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge(props: { status: string }) {
  const config = {
    matched: "bg-emerald-100 text-emerald-800",
    weak_match: "bg-amber-100 text-amber-800",
    not_found: "bg-red-100 text-red-800",
  } as const;

  const labelMap: Record<string, string> = {
    matched: "Conforme",
    weak_match: "Faible",
    not_found: "Non trouvé",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        config[props.status as keyof typeof config] ??
        "bg-slate-100 text-slate-700"
      }`}
    >
      {labelMap[props.status] ?? props.status}
    </span>
  );
}

function RecommendedSuppliers(props: { result: FullComparisonResponse }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">
        Fournisseurs recommandés
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Classement basé sur le nombre de meilleures offres et la compatibilité
        moyenne.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {props.result.summary.recommendedSuppliers.map((supplier, index) => {
          return (
            <div
              key={`${supplier.supplierName}-${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {supplier.supplierName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {supplier.numberOfBestOffers} meilleure(s) offre(s)
                  </p>
                </div>

                <div className="rounded-xl bg-white px-3 py-2 text-right shadow-sm">
                  <p className="text-xs text-slate-500">Compatibilité</p>
                  <p className="text-lg font-bold text-emerald-700">
                    {supplier.averageCompatibility}%
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Total HT
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {supplier.totalAmountHT !== null
                    ? formatMoney(supplier.totalAmountHT)
                    : "N/A"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ValidationSection(props: { products: ProductNeedingValidation[] }) {
  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-amber-950">
        Produits nécessitant une validation
      </h2>
      <p className="mt-1 text-sm text-amber-800">
        Ces articles demandent une vérification manuelle ou une recherche de
        marché complémentaire.
      </p>

      <div className="mt-6 space-y-4">
        {props.products.map((product) => {
          return (
            <div
              key={product.requestedProductId}
              className="rounded-2xl border border-amber-200 bg-white p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-slate-500">Produit demandé</p>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {product.requestedDesignation}
                    </h3>
                  </div>

                  <p className="text-sm text-slate-600">{product.reason}</p>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      Compatibilité {product.compatibilityPercentage}%
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      Recherche: {product.marketSearchQuery}
                    </span>
                  </div>
                </div>
              </div>

              {product.suggestedSuppliers.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700">
                    Fournisseurs suggérés
                  </p>

                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {product.suggestedSuppliers.map((supplier, index) => {
                      return (
                        <div
                          key={`${supplier.companyName ?? "supplier"}-${index}`}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
                        >
                          <p className="font-semibold text-slate-900">
                            {supplier.companyName ?? "Entreprise inconnue"}
                          </p>
                          <p className="mt-1 text-slate-600">
                            Contact: {supplier.contactName ?? "N/A"}
                          </p>
                          <p className="text-slate-600">
                            Email: {supplier.email ?? "N/A"}
                          </p>
                          <p className="text-slate-600">
                            Téléphone: {supplier.phone ?? "N/A"}
                          </p>
                          <p className="text-slate-600">
                            Site:{" "}
                            {supplier.website ? (
                              <a
                                href={supplier.website}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-emerald-700 underline"
                              >
                                {supplier.website}
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </p>
                          <p className="text-slate-600">
                            Source:{" "}
                            {supplier.source ? (
                              <a
                                href={supplier.source}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-emerald-700 underline"
                              >
                                Voir source
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </p>
                          <p className="mt-2 text-xs font-semibold text-emerald-700">
                            Confiance: {supplier.confidence}%
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ErrorAlert(props: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
      <p className="text-sm font-semibold">Erreur</p>
      <p className="mt-1 text-sm">{props.message}</p>
    </div>
  );
}

function StatusLine(props: { label: string; valid: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
          props.valid
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-200 text-slate-500"
        }`}
      >
        {props.valid ? "✓" : "•"}
      </span>
      <span>{props.label}</span>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

async function getErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const data = (await response.json()) as {
        message?: string;
        error?: string;
      } | null;

      return (
        data?.message ?? data?.error ?? `Erreur serveur (${response.status})`
      );
    }

    const text = await response.text();
    return text || `Erreur serveur (${response.status})`;
  } catch {
    return `Erreur serveur (${response.status})`;
  }
}
