import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";

const API_BASE_URL = "https://api.digitservz.dz";

type DocumentSource = "sent" | "received";

type OfferDocumentFile = {
  uid: string;
  id: string;
  source: DocumentSource;
  name: string;
  mimeType: string | null;
  size: number | null;
  attachmentType: string | null;
  supplierId: string | null;
  supplierName: string | null;
  responseId: string | null;
  createdAt: string;
  downloadUrl: string;
  folderFileId?: string;
};

type SystemFolder = {
  id: string;
  name: string;
  kind: "sent" | "received" | "custom-root";
  files: OfferDocumentFile[];
  children?: PersistedFolder[];
};

type PersistedFolder = {
  id: string;
  name: string;
  kind: "custom";
  files: OfferDocumentFile[];
  children: PersistedFolder[];
  parentId: string | null;
  createdAt: string;
};

type OfferSummary = {
  id: string;
  title: string;
  emailSubject: string | null;
  status: string;
  sentAt: string | null;
  createdAt: string;
  attachmentName: string | null;
  attachmentPath: string | null;
  attachmentMimeType: string | null;
  attachmentSize: number | null;
};

function formatFileSize(size: number | null) {
  if (!size) return "-";
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function getAllFilesFromFolder(
  folder: SystemFolder | PersistedFolder,
): OfferDocumentFile[] {
  const childFiles = folder.children?.flatMap(getAllFilesFromFolder) ?? [];
  return [...folder.files, ...childFiles];
}

export default function OfferDocumentsPage() {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();

  const [offer, setOffer] = useState<OfferSummary | null>(null);
  const [systemFolders, setSystemFolders] = useState<SystemFolder[]>([]);
  const [persistedFolders, setPersistedFolders] = useState<PersistedFolder[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(["sent", "received", "custom"]),
  );
  const [newFolderName, setNewFolderName] = useState("");
  const [savingFolder, setSavingFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const allFolders: (SystemFolder | PersistedFolder)[] = useMemo(
    () => [
      ...systemFolders,
      {
        id: "custom",
        name: "Sous-dossiers créés",
        kind: "custom-root",
        files: [],
        children: persistedFolders,
      },
    ],
    [systemFolders, persistedFolders],
  );

  const allFiles = useMemo(() => {
    return allFolders.flatMap((f) => getAllFilesFromFolder(f));
  }, [allFolders]);

  const selectedFiles = useMemo(() => {
    return allFiles.filter((file) => selectedIds.has(file.uid));
  }, [allFiles, selectedIds]);

  useEffect(() => {
    if (!offerId) return;
    loadAll();
  }, [offerId]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadOffer(), loadDocuments(), loadPersistedFolders()]);
    setLoading(false);
  }

  async function loadOffer() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/offers/${offerId}`);
      const json = await res.json();
      if (json.success) setOffer(json.data);
    } catch (e) {
      console.error("Erreur chargement offre", e);
    }
  }

  async function loadDocuments() {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/offers/${offerId}/documents`,
      );
      const json = await res.json();
      if (json.success) {
        setSystemFolders(json.data.folders);
      }
    } catch (e) {
      console.error("Erreur chargement documents", e);
    }
  }

  async function loadPersistedFolders() {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/offers/${offerId}/document-folders`,
      );
      const json = await res.json();
      if (json.success) {
        const transform = (folders: any[]): PersistedFolder[] =>
          folders.map((f) => ({
            id: f.id,
            name: f.name,
            kind: "custom",
            parentId: f.parentId,
            createdAt: f.createdAt,
            files: (f.files ?? []).map((file: any) => ({
              ...file,
              folderFileId: file.folderFileId,
            })),
            children: f.children ? transform(f.children) : [],
          }));
        setPersistedFolders(transform(json.data));
      }
    } catch (e) {
      console.error("Erreur chargement dossiers persistés", e);
    }
  }

  function toggleExpanded(folderId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }

  function toggleFile(file: OfferDocumentFile) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(file.uid)) next.delete(file.uid);
      else next.add(file.uid);
      return next;
    });
  }

  function toggleFolder(folder: SystemFolder | PersistedFolder) {
    const folderFiles = getAllFilesFromFolder(folder);
    const allSelected =
      folderFiles.length > 0 &&
      folderFiles.every((file) => selectedIds.has(file.uid));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const file of folderFiles) {
        if (allSelected) next.delete(file.uid);
        else next.add(file.uid);
      }
      return next;
    });
  }

  async function createFolderFromSelection() {
    const name = newFolderName.trim();
    if (!name || selectedFiles.length === 0 || !offerId) return;

    setSavingFolder(true);
    try {
      const filesPayload = selectedFiles.map((file) => {
        if (file.source === "received") {
          return { source: "received", attachmentId: file.id };
        }
        return { source: "sent" };
      });

      const res = await fetch(
        `${API_BASE_URL}/api/offers/${offerId}/document-folders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, parentId: null, files: filesPayload }),
        },
      );

      if (res.ok) {
        setNewFolderName("");
        setSelectedIds(new Set());
        await loadPersistedFolders();
        setExpandedIds((prev) => new Set([...prev, "custom"]));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingFolder(false);
    }
  }

  async function deleteFolder(folderId: string) {
    if (!confirm("Supprimer ce sous-dossier ?")) return;
    try {
      await fetch(
        `${API_BASE_URL}/api/offers/${offerId}/document-folders/${folderId}`,
        { method: "DELETE" },
      );
      await loadPersistedFolders();
    } catch (e) {
      console.error(e);
    }
  }

  async function renameFolder(folderId: string) {
    const name = renameValue.trim();
    if (!name) return;
    try {
      await fetch(
        `${API_BASE_URL}/api/offers/${offerId}/document-folders/${folderId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
      );
      setRenamingFolder(null);
      setRenameValue("");
      await loadPersistedFolders();
    } catch (e) {
      console.error(e);
    }
  }

  async function removeFileFromFolder(folderId: string, fileId: string) {
    try {
      await fetch(
        `${API_BASE_URL}/api/offers/${offerId}/document-folders/${folderId}/files/${fileId}`,
        { method: "DELETE" },
      );
      await loadPersistedFolders();
    } catch (e) {
      console.error(e);
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function getStatusLabel(status: string) {
    const map: Record<string, string> = {
      draft: "Brouillon",
      pending: "En attente",
      sent: "Envoyée",
      completed: "Terminée",
      failed: "Échouée",
    };
    return map[status] || status;
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      pending: "bg-yellow-100 text-yellow-700",
      sent: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-gray-100 text-gray-700";
  }

  const totalSelectedSize = selectedFiles.reduce(
    (sum, f) => sum + (f.size || 0),
    0,
  );

  function renderFolder(folder: SystemFolder | PersistedFolder, level = 0) {
    const isExpanded = expandedIds.has(folder.id);
    const folderFiles = getAllFilesFromFolder(folder);
    const selectedCount = folderFiles.filter((file) =>
      selectedIds.has(file.uid),
    ).length;
    const hasChildren = folder.children && folder.children.length > 0;
    const hasFiles = folder.files.length > 0;
    const isEmpty = !hasChildren && !hasFiles;
    const isFolderChecked =
      folderFiles.length > 0 &&
      folderFiles.every((file) => selectedIds.has(file.uid));
    const isCustomFolder = folder.kind === "custom";
    const isCustomRoot = folder.kind === "custom-root";

    return (
      <div key={folder.id} className="space-y-1">
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
            isCustomRoot ? "bg-indigo-50 border-indigo-200" : "bg-gray-50"
          }`}
          style={{ marginLeft: level * 16 }}
        >
          <button
            type="button"
            onClick={() => toggleExpanded(folder.id)}
            className="w-6 text-sm text-gray-600"
          >
            {isExpanded ? "▾" : "▸"}
          </button>

          <input
            type="checkbox"
            checked={isFolderChecked}
            disabled={folderFiles.length === 0}
            onChange={() => toggleFolder(folder)}
          />

          <div className="flex-1 min-w-0">
            {renamingFolder === folder.id ? (
              <div className="flex items-center gap-2">
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") renameFolder(folder.id);
                    if (e.key === "Escape") {
                      setRenamingFolder(null);
                      setRenameValue("");
                    }
                  }}
                  autoFocus
                  className="rounded border px-2 py-1 text-sm w-full"
                />
                <button
                  onClick={() => renameFolder(folder.id)}
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                >
                  OK
                </button>
              </div>
            ) : (
              <p
                className={`font-medium truncate ${isCustomRoot ? "text-indigo-900" : "text-gray-900"}`}
              >
                {folder.name}
              </p>
            )}
            <p className="text-xs text-gray-500">
              {folderFiles.length} fichier(s)
              {selectedCount > 0 ? ` · ${selectedCount} sélectionné(s)` : ""}
            </p>
          </div>

          {isCustomFolder && renamingFolder !== folder.id && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setRenamingFolder(folder.id);
                  setRenameValue(folder.name);
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Renommer
              </button>
              <button
                onClick={() => deleteFolder(folder.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Supprimer
              </button>
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="space-y-1">
            {isEmpty && (
              <p
                className="text-sm text-gray-400 py-1"
                style={{ marginLeft: level * 16 + 40 }}
              >
                Aucun fichier.
              </p>
            )}

            {folder.files.map((file) => (
              <div
                key={file.uid}
                className="flex items-center justify-between rounded-lg border bg-white px-3 py-2"
                style={{ marginLeft: level * 16 + 40 }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(file.uid)}
                    onChange={() => toggleFile(file)}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {file.source === "sent" ? "Envoyé" : "Reçu"}
                      {file.supplierName ? ` · ${file.supplierName}` : ""}
                      {" · "}
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`${API_BASE_URL}${file.downloadUrl}`}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                  >
                    Télécharger
                  </a>
                  {isCustomFolder && file.folderFileId && (
                    <button
                      onClick={() =>
                        removeFileFromFolder(folder.id, file.folderFileId!)
                      }
                      className="text-xs text-red-600 hover:underline"
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            ))}

            {folder.children?.map((child) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Chargement des documents…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border p-2 hover:bg-gray-50"
              title="Retour"
            >
              ←
            </button>
            <div className="flex-1 min-w-0">
              {offer ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900 truncate">
                    {offer.title}
                  </h1>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                      offer.status,
                    )}`}
                  >
                    {getStatusLabel(offer.status)}
                  </span>
                </div>
              ) : (
                <h1 className="text-xl font-bold text-gray-900">
                  Offre introuvable
                </h1>
              )}
              {offer?.emailSubject && (
                <p className="mt-0.5 text-sm text-gray-500">
                  {offer.emailSubject}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate(`/offers/${offerId}/comparison`)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Comparaison
              </button>
              <button
                onClick={() => navigate(`/offers/${offerId}/responses`)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Réponses
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Main area */}
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-xl border bg-white p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold">Documents de l’offre</h2>
                  <p className="text-sm text-gray-500">
                    Fichiers envoyés, reçus et sous-dossiers créés.
                  </p>
                </div>
                <button
                  onClick={loadAll}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Actualiser
                </button>
              </div>

              {/* Selection banner */}
              <div className="rounded-lg border bg-blue-50 p-4 mb-4">
                <p className="text-sm font-medium text-blue-800">
                  Sélection actuelle : {selectedFiles.length} fichier(s)
                  {totalSelectedSize > 0 && (
                    <span> · {formatFileSize(totalSelectedSize)}</span>
                  )}
                </p>

                {selectedFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Nom du sous-dossier, ex: Lot 1 retenu"
                      className="min-w-[280px] rounded-lg border px-3 py-2 text-sm"
                    />
                    <button
                      onClick={createFolderFromSelection}
                      disabled={savingFolder}
                      className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {savingFolder ? "Création…" : "Créer un sous-dossier"}
                    </button>
                    <button
                      onClick={clearSelection}
                      className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Vider la sélection
                    </button>
                  </div>
                )}
              </div>

              {/* Folders tree */}
              <div className="space-y-3">
                {allFolders.map((folder) => renderFolder(folder))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:col-span-1">
            {/* Offer info */}
            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold text-gray-900">
                Détails de l’offre
              </h3>
              {offer ? (
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Statut</dt>
                    <dd className="font-medium">
                      {getStatusLabel(offer.status)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Créée le</dt>
                    <dd className="font-medium">
                      {new Date(offer.createdAt).toLocaleDateString("fr-DZ")}
                    </dd>
                  </div>
                  {offer.sentAt && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Envoyée le</dt>
                      <dd className="font-medium">
                        {new Date(offer.sentAt).toLocaleDateString("fr-DZ")}
                      </dd>
                    </div>
                  )}
                  {offer.attachmentName && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Cahier des charges</dt>
                      <dd
                        className="font-medium truncate max-w-[120px]"
                        title={offer.attachmentName}
                      >
                        {offer.attachmentName}
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="mt-2 text-sm text-gray-400">Non disponible</p>
              )}
            </div>

            {/* Selection summary */}
            {selectedFiles.length > 0 && (
              <div className="rounded-xl border bg-blue-50 p-4">
                <h3 className="font-semibold text-blue-900">
                  Sélection active
                </h3>
                <dl className="mt-2 space-y-1 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <dt>Fichiers</dt>
                    <dd className="font-bold">{selectedFiles.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Taille totale</dt>
                    <dd className="font-bold">
                      {formatFileSize(totalSelectedSize)}
                    </dd>
                  </div>
                </dl>
                <button
                  onClick={() => {
                    selectedFiles.forEach((file) => {
                      const link = document.createElement("a");
                      link.href = `${API_BASE_URL}${file.downloadUrl}`;
                      link.download = file.name;
                      link.click();
                    });
                  }}
                  className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                >
                  Télécharger tout
                </button>
              </div>
            )}

            {/* Sous-dossiers count */}
            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold text-gray-900">Sous-dossiers</h3>
              <p className="mt-1 text-2xl font-bold text-indigo-600">
                {persistedFolders.length}
              </p>
              <p className="text-xs text-gray-500">
                dossier(s) créé(s) pour cette offre
              </p>
            </div>

            {/* Shortcuts */}
            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold text-gray-900">Navigation</h3>
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => navigate(`/offers/${offerId}/comparison`)}
                  className="w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span className="block font-medium">Comparaison</span>
                  <span className="text-xs text-gray-500">
                    Analyser les propositions
                  </span>
                </button>
                <button
                  onClick={() => navigate(`/offers/${offerId}/responses`)}
                  className="w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span className="block font-medium">Réponses</span>
                  <span className="text-xs text-gray-500">
                    Voir les réponses fournisseurs
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
