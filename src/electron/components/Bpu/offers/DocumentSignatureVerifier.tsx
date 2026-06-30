// components/DocumentSignatureVerifier.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiClient } from "./hooks/apiClient";
// adjust path to your apiClient file

// ── Types (mirrored from backend) ─────────────────────────────────────────

type StampType =
  | "official_round"
  | "rectangular"
  | "ink_stamp"
  | "digital"
  | "none";
type SignatureType = "handwritten" | "digital_typed" | "none";
type DocumentQuality = "clear" | "blurry" | "unreadable";
type PageStrategy = "all" | "first" | "last" | "first_and_last";

type VerificationDetails = {
  stampLocation: string;
  signatureLocation: string;
  hasCompanyInfo: boolean;
  hasDate: boolean;
};

type VerificationResult = {
  verificationId: string;
  isApproved: boolean;
  confidence: number;
  stampDetected: boolean;
  signatureDetected: boolean;
  stampType: StampType;
  signatureType: SignatureType;
  documentQuality: DocumentQuality;
  approvalReason: string;
  pagesAnalyzed: number;
  details: VerificationDetails;
};

type ApiResponse =
  | { success: true; data: VerificationResult }
  | { success: false; error: string };

// ── Component ─────────────────────────────────────────────────────────────

export default function DocumentSignatureVerifier() {
  const [file, setFile] = useState<File | null>(null);
  const [pageStrategy, setPageStrategy] = useState<PageStrategy>("last");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected) {
      setFile(selected);
      setResult(null);
      setError(null);
    }
  };
  const previewUrl = useMemo(() => {
    if (!file || !file.type.startsWith("image/")) return null;

    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0] ?? null;
    if (dropped) {
      setFile(dropped);
      setResult(null);
      setError(null);
    }
  }, []);

  const handleVerify = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("pageStrategy", pageStrategy);

    try {
      const res = await apiClient
        .post("signature/verify", { body: formData })
        .json<ApiResponse>();

      if (!res.success) {
        setError(res.error);
      } else {
        setResult(res.data);
      }
    } catch (err: any) {
      setError(
        err?.message || "Une erreur est survenue lors de la vérification.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isImage = file?.type.startsWith("image/");
  const isPdf = file?.type === "application/pdf";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">
        Vérification de tampon & signature
      </h2>

      {/* ── Upload Zone ─────────────────────────────────────────────────── */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
          ${file ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-slate-400 bg-slate-50"}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp,image/bmp,image/tiff"
          onChange={handleFileChange}
          className="hidden"
        />

        {file ? (
          <div className="space-y-2">
            <p className="font-medium text-slate-700">{file.name}</p>
            <p className="text-sm text-slate-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            {isImage && previewUrl && (
              <img
                src={previewUrl}
                alt="Aperçu"
                className="max-h-48 mx-auto rounded-lg shadow-sm mt-2"
              />
            )}
            {isPdf && (
              <p className="text-sm text-slate-500 mt-2">
                PDF prêt pour analyse
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2 text-slate-500">
            <p className="text-lg">
              📄 Glissez un fichier ici ou cliquez pour parcourir
            </p>
            <p className="text-sm">
              PDF, PNG, JPG, WebP, BMP, TIFF (max 50 MB)
            </p>
          </div>
        )}
      </div>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      {file && (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Stratégie d'analyse des pages
            </label>
            <select
              value={pageStrategy}
              onChange={(e) => setPageStrategy(e.target.value as PageStrategy)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="last">
                Dernière page (recommandé pour tampons)
              </option>
              <option value="first">Première page</option>
              <option value="first_and_last">Première et dernière page</option>
              <option value="all">Toutes les pages (max 5)</option>
            </select>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={reset}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
            >
              Réinitialiser
            </button>
            <button
              onClick={handleVerify}
              disabled={isLoading}
              className={`
                flex-1 sm:flex-none px-6 py-2 rounded-lg font-medium text-white transition
                ${isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
              `}
            >
              {isLoading ? "Analyse en cours..." : "Vérifier le document"}
            </button>
          </div>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          <p className="font-semibold">Erreur</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* ── Result ───────────────────────────────────────────────────────── */}
      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Status Banner */}
          <div
            className={`
              rounded-xl p-5 border flex items-start gap-4
              ${
                result.isApproved
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : result.stampDetected
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-red-50 border-red-200 text-red-800"
              }
            `}
          >
            <div className="text-3xl">
              {result.isApproved ? "✅" : result.stampDetected ? "⚠️" : "❌"}
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {result.isApproved
                  ? "Document approuvé"
                  : result.stampDetected
                    ? "Vérification requise"
                    : "Document non approuvé"}
              </h3>
              <p className="text-sm opacity-90 mt-1">{result.approvalReason}</p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              label="Confiance"
              value={`${(result.confidence * 100).toFixed(0)}%`}
              highlight={result.confidence >= 0.75}
            />
            <MetricCard
              label="Tampon"
              value={result.stampDetected ? "Détecté" : "Absent"}
              highlight={result.stampDetected}
            />
            <MetricCard
              label="Signature"
              value={result.signatureDetected ? "Détectée" : "Absente"}
              highlight={result.signatureDetected}
            />
            <MetricCard
              label="Qualité"
              value={translateQuality(result.documentQuality)}
              highlight={result.documentQuality === "clear"}
            />
          </div>

          {/* Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h4 className="font-semibold text-slate-800">
              Détails de l'analyse
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <DetailRow
                label="Type de tampon"
                value={translateStampType(result.stampType)}
              />
              <DetailRow
                label="Type de signature"
                value={translateSignatureType(result.signatureType)}
              />
              <DetailRow
                label="Emplacement tampon"
                value={result.details.stampLocation}
              />
              <DetailRow
                label="Emplacement signature"
                value={result.details.signatureLocation}
              />
              <DetailRow
                label="Infos entreprise"
                value={result.details.hasCompanyInfo ? "Oui" : "Non"}
              />
              <DetailRow
                label="Date présente"
                value={result.details.hasDate ? "Oui" : "Non"}
              />
              <DetailRow
                label="Pages analysées"
                value={String(result.pagesAnalyzed)}
              />
              <DetailRow
                label="ID vérification"
                value={result.verificationId.slice(0, 8) + "..."}
              />
            </div>

            {/* Confidence Bar */}
            <div className="pt-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Score de confiance</span>
                <span>{(result.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`
                    h-full rounded-full transition-all duration-1000
                    ${result.confidence >= 0.75 ? "bg-emerald-500" : result.confidence >= 0.5 ? "bg-amber-500" : "bg-red-500"}
                  `}
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight: boolean;
}) {
  return (
    <div
      className={`
      rounded-lg border p-3 text-center transition
      ${highlight ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}
    `}
    >
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p
        className={`text-lg font-bold mt-1 ${highlight ? "text-emerald-700" : "text-slate-700"}`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function translateStampType(type: StampType): string {
  const map: Record<StampType, string> = {
    official_round: "Rond officiel",
    rectangular: "Rectangulaire",
    ink_stamp: "Tampon encreur",
    digital: "Numérique",
    none: "Aucun",
  };
  return map[type] ?? type;
}

function translateSignatureType(type: SignatureType): string {
  const map: Record<SignatureType, string> = {
    handwritten: "Manuscrite",
    digital_typed: "Dactylographiée",
    none: "Aucune",
  };
  return map[type] ?? type;
}

function translateQuality(q: DocumentQuality): string {
  const map: Record<DocumentQuality, string> = {
    clear: "Claire",
    blurry: "Floue",
    unreadable: "Illisible",
  };
  return map[q] ?? q;
}
