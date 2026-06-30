import { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileArchive,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import {
  fetchOffers,
  fetchLibraryDocuments,
  uploadLibraryDocuments,
  deleteLibraryDocument,
  downloadLibraryDocument,
  exportLibraryDocumentsZip,
  type LibraryDocument,
  type DocumentCategory,
  type OfferOption,
} from "./hooks/services/api";
const categoryLabels: Record<DocumentCategory, string> = {
  legal: "Documents juridiques",
  tax: "Documents fiscaux",
  commercial: "Documents commerciaux",
};

const documentTypes: Record<
  DocumentCategory,
  { value: string; label: string }[]
> = {
  legal: [
    { value: "rc", label: "RC" },
    { value: "nif", label: "NIF" },
    { value: "nis", label: "NIS" },
    { value: "statuts", label: "Statuts" },
    { value: "decision_gerant", label: "Décision du gérant" },
    { value: "rib", label: "RIB" },
  ],
  tax: [
    { value: "attestation_fiscale", label: "Attestation fiscale" },
    { value: "cnas", label: "CNAS" },
    { value: "casnos", label: "CASNOS" },
    { value: "non_faillite", label: "Non-faillite" },
  ],
  commercial: [
    { value: "catalogue", label: "Catalogues" },
    { value: "fiche_technique", label: "Fiches techniques" },
    { value: "iso", label: "ISO" },
    { value: "ce", label: "CE" },
    { value: "certificat_conformite", label: "Certificats de conformité" },
    { value: "certificat_origine", label: "Certificats d'origine" },
  ],
};

function formatFileSize(size?: number | null) {
  if (!size) return "-";
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function getDocTypeLabel(category: DocumentCategory, value: string) {
  return (
    documentTypes[category].find((item) => item.value === value)?.label ?? value
  );
}

export default function OfferDocumentsLibrary() {
  const [offers, setOffers] = useState<OfferOption[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState("");

  const [category, setCategory] = useState<DocumentCategory>("legal");
  const [docType, setDocType] = useState(documentTypes.legal[0].value);
  const [files, setFiles] = useState<File[]>([]);

  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groupedDocuments = useMemo(() => {
    const groups: Record<DocumentCategory, LibraryDocument[]> = {
      legal: [],
      tax: [],
      commercial: [],
    };
    for (const document of documents) {
      groups[document.category].push(document);
    }
    return groups;
  }, [documents]);

  useEffect(() => {
    loadOffers();
  }, []);

  useEffect(() => {
    if (selectedOfferId) {
      loadDocuments(selectedOfferId);
    }
  }, [selectedOfferId]);

  useEffect(() => {
    setDocType(documentTypes[category][0].value);
  }, [category]);

  async function loadOffers() {
    try {
      setLoadingOffers(true);
      setError(null);
      const result = await fetchOffers();
      setOffers(result);
      if (result.length > 0) {
        setSelectedOfferId(result[0].id);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erreur chargement des offres.",
      );
    } finally {
      setLoadingOffers(false);
    }
  }

  async function loadDocuments(offerId: string) {
    try {
      setLoadingDocuments(true);
      setError(null);
      const data = await fetchLibraryDocuments(offerId);
      setDocuments(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erreur chargement des documents.",
      );
    } finally {
      setLoadingDocuments(false);
    }
  }

  async function handleUpload() {
    if (!selectedOfferId) {
      setError("Veuillez sélectionner une offre.");
      return;
    }
    if (files.length === 0) {
      setError("Veuillez sélectionner au moins un fichier.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setMessage(null);

      const formData = new FormData();
      formData.append("category", category);
      formData.append("docType", docType);
      for (const file of files) {
        formData.append("files", file);
      }

      await uploadLibraryDocuments(selectedOfferId, formData);
      setFiles([]);
      setMessage("Fichier(s) importé(s) avec succès.");
      await loadDocuments(selectedOfferId);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Erreur lors de l'import.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(documentItem: LibraryDocument) {
    try {
      await downloadLibraryDocument(
        selectedOfferId,
        documentItem.id,
        documentItem.originalFileName,
      );
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Erreur téléchargement.",
      );
    }
  }

  async function handleExportZip(categoryFilter?: DocumentCategory) {
    if (!selectedOfferId) {
      setError("Veuillez sélectionner une offre.");
      return;
    }

    try {
      setExporting(true);
      setError(null);
      await exportLibraryDocumentsZip(selectedOfferId, categoryFilter);
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Erreur export ZIP.",
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete(documentItem: LibraryDocument) {
    const confirmed = window.confirm(
      `Supprimer le document "${documentItem.originalFileName}" ?`,
    );
    if (!confirmed) return;

    try {
      setError(null);
      setMessage(null);
      await deleteLibraryDocument(selectedOfferId, documentItem.id);
      setMessage("Document supprimé.");
      await loadDocuments(selectedOfferId);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Erreur suppression.",
      );
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Bibliothèque documentaire
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Importer, consulter et exporter les documents liés aux offres.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Offre
            </label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              disabled={loadingOffers}
              value={selectedOfferId}
              onChange={(event) => setSelectedOfferId(event.target.value)}
            >
              {loadingOffers && <option>Chargement...</option>}
              {!loadingOffers &&
                offers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.title}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Catégorie
            </label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as DocumentCategory)
              }
            >
              <option value="legal">Documents juridiques</option>
              <option value="tax">Documents fiscaux</option>
              <option value="commercial">Documents commerciaux</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Type
            </label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={docType}
              onChange={(event) => setDocType(event.target.value)}
            >
              {documentTypes[category].map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Fichiers
          </label>
          <input
            multiple
            type="file"
            className="block w-full rounded-lg border px-3 py-2 text-sm"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
          {files.length > 0 && (
            <div className="mt-2 text-sm text-slate-500">
              {files.length} fichier(s) sélectionné(s)
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={uploading || !selectedOfferId}
            onClick={handleUpload}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Importer
          </button>

          <button
            type="button"
            disabled={exporting || !selectedOfferId}
            onClick={() => handleExportZip()}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileArchive className="h-4 w-4" />
            )}
            Exporter tout en ZIP
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {loadingDocuments ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des documents...
          </div>
        ) : (
          (Object.keys(groupedDocuments) as DocumentCategory[]).map(
            (groupKey) => {
              const groupDocuments = groupedDocuments[groupKey];
              return (
                <div
                  key={groupKey}
                  className="rounded-xl border bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between border-b px-5 py-4">
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        {categoryLabels[groupKey]}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {groupDocuments.length} document(s)
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={groupDocuments.length === 0 || exporting}
                      onClick={() => handleExportZip(groupKey)}
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-700 disabled:opacity-50"
                    >
                      <FileArchive className="h-4 w-4" />
                      Export ZIP
                    </button>
                  </div>

                  {groupDocuments.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-slate-500">
                      Aucun document.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {groupDocuments.map((documentItem) => (
                        <div
                          key={documentItem.id}
                          className="flex items-center justify-between gap-4 px-5 py-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="rounded-lg bg-slate-100 p-2">
                              <FileText className="h-5 w-5 text-slate-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {documentItem.originalFileName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {getDocTypeLabel(
                                  documentItem.category,
                                  documentItem.docType,
                                )}{" "}
                                · {formatFileSize(documentItem.fileSize)} ·{" "}
                                {new Date(
                                  documentItem.createdAt,
                                ).toLocaleDateString("fr-DZ")}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownload(documentItem)}
                              className="rounded-lg border p-2 text-slate-700 hover:bg-slate-50"
                              title="Télécharger"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(documentItem)}
                              className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            },
          )
        )}
      </div>
    </div>
  );
}
