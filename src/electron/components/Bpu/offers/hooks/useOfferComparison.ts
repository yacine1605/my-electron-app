import { useState, useCallback, useRef, useEffect } from "react";
import { API_BASE_URL, apiClient } from "./apiClient";

export interface OfferItem {
  id: string;
  itemNumber: number;
  name: string;
  code: string | null;
  description: string | null;
  requestedQuantity: number;
  technicalRequirements: string[];
  minConformityPercentage: number;
}

export interface SupplierItemAnalysis {
  offerItemId: string;
  itemNumber: number;
  requestedName: string;
  requestedQuantity: number;
  technicalRequirements: string[];
  proposedName: string;
  proposedBrand: string | null;
  proposedCode: string | null;
  quantityOffered: number | null;
  unitPriceHT: number;
  totalHT: number;
  tvaPercentage: number;
  conformityPercentage: number | null;
  isTechnicallyCompliant: boolean | null;
  status: string;
  aiSummary: string | null;
  aiRecommendation: string | null;
  analysisDetails: Array<{
    requirementLabel: string;
    matched: boolean;
    score: number;
  }>;
}

export interface SupplierComparison {
  supplierId: string;
  supplierName: string;
  globalScore: number;
  technicalScore: number;
  priceScore: number;
  conditionsScore: number;
  rank: number | null;
  isBestSupplier: boolean;
  isEligible: boolean;
  totalHT: number;
  totalTTC: number;
  summary: string | null;
  items: SupplierItemAnalysis[];
}

export interface ComparisonData {
  success: boolean;
  offerId: string;
  offerTitle: string;
  offerDescription: string | null;
  medicalEntity: string | null;
  requestedItems: OfferItem[];
  suppliers: SupplierComparison[];
  bestSupplier: {
    supplierId: string;
    supplierName: string;
    globalScore: number;
    totalHT: number;
    rank: number | null;
    summary: string | null;
  } | null;
}

export interface MissingItem {
  itemNumber: number;
  itemName: string;
  onlineSuppliers: string[];
}

export function useOfferComparison(offerId: string | undefined) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);
  const [searchResults, setSearchResults] = useState<
    Map<string, { suppliers: string[] }>
  >(new Map());

  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  // ── Lifecycle: cleanup interval on unmount ──
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, []);

  // ── Lifecycle: stop polling if offerId changes (route navigation) ──
  useEffect(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
      setAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [offerId]);

  const safeSet = useCallback(
    <T>(
      setter: React.Dispatch<React.SetStateAction<T>>,
      value: NoInfer<T> | NoInfer<(prev: T) => T>,
    ) => {
      if (isMounted.current) {
        setter(value as React.SetStateAction<T>);
      }
    },
    [],
  );
  const clearProgressInterval = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  const loadComparison = useCallback(async () => {
    if (!offerId) return;
    safeSet(setLoading, true);
    safeSet(setError, null);
    try {
      const json = await apiClient
        .get(`offers/${offerId}/comparison`)
        .json<{ success: boolean; data: ComparisonData; message?: string }>();
      if (json.success) {
        safeSet(setData, json.data);
      } else {
        safeSet(setError, json.message ?? "Erreur lors du chargement");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        safeSet(setError, "Session expirée. Veuillez vous reconnecter.");
      } else if (err.response?.status === 403) {
        safeSet(setError, "Vous n'avez pas accès à cette offre.");
      } else {
        safeSet(setError, err.message ?? "Erreur de connexion");
      }
    } finally {
      safeSet(setLoading, false);
    }
  }, [offerId, safeSet]);

  const pollJobStatus = useCallback(
    async (jobId: string) => {
      if (!offerId) return;
      try {
        const json = await apiClient
          .get(`offers/${offerId}/analyze/${jobId}/status`)
          .json<{
            success: boolean;
            data: { status: string; progress: number };
          }>();
        if (json.success) {
          safeSet(setAnalysisProgress, json.data.progress);
          if (json.data.status === "completed") {
            clearProgressInterval();
            safeSet(setAnalyzing, false);
            safeSet(setAnalysisProgress, 100);
            await loadComparison();
          } else if (json.data.status === "failed") {
            clearProgressInterval();
            safeSet(setAnalyzing, false);
            safeSet(setError, "L'analyse a échoué.");
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    },
    [offerId, loadComparison, clearProgressInterval, safeSet],
  );

  // Keep a ref to the latest pollJobStatus so the interval always calls the current one
  const pollJobStatusRef = useRef(pollJobStatus);
  pollJobStatusRef.current = pollJobStatus;

  const startAnalysis = useCallback(
    async (force = false) => {
      if (!offerId) return;
      clearProgressInterval();
      safeSet(setAnalyzing, true);
      safeSet(setAnalysisProgress, 0);
      safeSet(setError, null);

      try {
        const json = await apiClient
          .post(`offers/${offerId}/analyze`, { json: { force } })
          .json<{
            success: boolean;
            data: { jobId: string };
            message?: string;
          }>();

        if (json.success) {
          progressInterval.current = setInterval(() => {
            pollJobStatusRef.current(json.data.jobId);
          }, 2000);
        } else {
          safeSet(setAnalyzing, false);
          safeSet(setError, json.message ?? "Erreur lors du lancement");
        }
      } catch (err: any) {
        safeSet(setAnalyzing, false);
        safeSet(setError, err.message ?? "Erreur de connexion");
      }
    },
    [offerId, clearProgressInterval, safeSet],
  );

  const handleExport = useCallback(async () => {
    if (!offerId) return;

    safeSet(setExporting, true);

    try {
      const json = await apiClient
        .post(`offers/${offerId}/export`, { timeout: false })
        .json<{
          data: {
            fileUrl: string;
            fileName: string;
          };
          message?: string;
        }>();

      if (json.success && json.data.fileUrl) {
        const downloadUrl = json.data.fileUrl.startsWith("http")
          ? json.data.fileUrl
          : `${API_BASE_URL}${json.data.fileUrl}`;

        window.open(downloadUrl, "_blank", "noopener,noreferrer");
      } else {
        safeSet(setError, json.message ?? "Erreur lors de l'export");
      }
    } catch (err: any) {
      safeSet(setError, err.message ?? "Erreur de connexion");
    } finally {
      safeSet(setExporting, false);
    }
  }, [offerId, safeSet]);

  const refreshMissingItems = useCallback(async () => {
    if (!offerId) return;
    try {
      const json = await apiClient
        .get(`offers/${offerId}/missing-items`)
        .json<{ success: boolean; data: { missingItems: MissingItem[] } }>();
      if (json.success) {
        safeSet(setMissingItems, json.data.missingItems);
      }
    } catch (err) {
      console.error("Erreur refresh missing items:", err);
    }
  }, [offerId, safeSet]);

  const regenerateMissing = useCallback(async () => {
    if (!offerId) return;
    try {
      const json = await apiClient
        .post(`offers/${offerId}/regenerate-missing`)
        .json<{ success: boolean; data: any[] }>();
      if (json.success) {
        setSearchResults((prev) => {
          const next = new Map(prev);
          json.data.forEach((item) => {
            next.set(item.itemName, item);
          });
          return next;
        });
      }
    } catch (err) {
      console.error("Erreur regenerate missing:", err);
    }
  }, [offerId]);

  const searchSuppliersForItem = useCallback(
    async (itemName: string) => {
      if (!offerId) return;
      try {
        const json = await apiClient
          .get(`offers/${offerId}/search-suppliers`, {
            searchParams: { q: itemName },
          })
          .json<{ success: boolean; data: { suppliers: string[] } }>();

        if (json.success) {
          setSearchResults((prev) => {
            const next = new Map(prev);
            next.set(itemName, json.data);
            return next;
          });
        }
      } catch (err) {
        console.error("Erreur recherche fournisseurs:", err);
      }
    },
    [offerId],
  );

  // ── ADD THIS ──
  // Auto-load comparison data when offerId is available
  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  return {
    data,
    loading,
    error,
    analyzing,
    analysisProgress,
    exporting,
    missingItems,
    searchResults,
    loadComparison,
    startAnalysis,
    handleExport,
    searchSuppliersForItem,
    refreshMissingItems,
    regenerateMissing,
  };
}
