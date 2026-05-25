import { apiClient } from "@/lib/hooks/apiClient";
import { useEffect, useMemo, useState } from "react";

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

type OfferDocumentFolder = {
  id: string;
  name: string;
  kind: string;
  files: OfferDocumentFile[];
  children?: OfferDocumentFolder[];
};

type CustomFolder = OfferDocumentFolder & {
  isCustom: true;
};

function formatFileSize(size: number | null) {
  if (!size) return "-";
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function getAllFilesFromFolder(
  folder: OfferDocumentFolder,
): OfferDocumentFile[] {
  const childFiles = folder.children?.flatMap(getAllFilesFromFolder) ?? [];
  return [...folder.files, ...childFiles];
}

function getAllFiles(folders: OfferDocumentFolder[]) {
  return folders.flatMap(getAllFilesFromFolder);
}

function transformApiFolders(apiFolders: any[]): CustomFolder[] {
  return apiFolders.map((f) => ({
    id: f.id,
    name: f.name,
    kind: "custom",
    files: (f.files ?? []).map((file: any) => ({ ...file })),
    children: f.children ? transformApiFolders(f.children) : [],
    isCustom: true,
  }));
}

export default function OfferDocumentsManager({
  offerId,
  onSelectionChange,
}: {
  offerId: string;
  onSelectionChange?: (files: OfferDocumentFile[]) => void;
}) {
  const [folders, setFolders] = useState<OfferDocumentFolder[]>([]);
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(["sent", "received"]),
  );
  const [loading, setLoading] = useState(false);
  const [savingFolder, setSavingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const allFolders = useMemo(
    () => [
      ...folders,
      {
        id: "custom",
        name: "Sous-dossiers / sélections partielles",
        kind: "custom-root",
        files: [],
        children: customFolders,
      },
    ],
    [folders, customFolders],
  );

  const allFiles = useMemo(() => getAllFiles(allFolders), [allFolders]);
  const selectedFiles = useMemo(() => {
    return allFiles.filter((file) => selectedIds.has(file.uid));
  }, [allFiles, selectedIds]);

  useEffect(() => {
    loadDocuments();
    loadCustomFolders();
  }, [offerId]);

  useEffect(() => {
    onSelectionChange?.(selectedFiles);
  }, [selectedFiles, onSelectionChange]);

  async function loadDocuments() {
    setLoading(true);
    try {
      const json = await apiClient
        .get(`offers/${offerId}/documents`)
        .json<{ success: boolean; data: { folders: OfferDocumentFolder[] } }>();
      if (json.success) {
        setFolders(json.data.folders);
      }
    } catch (error) {
      console.error("Erreur chargement documents:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomFolders() {
    try {
      const json = await apiClient
        .get(`offers/${offerId}/document-folders`)
        .json<{ success: boolean; data: any[] }>();
      if (json.success) {
        setCustomFolders(transformApiFolders(json.data));
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

  function toggleFolder(folder: OfferDocumentFolder) {
    const folderFiles = getAllFilesFromFolder(folder);
    const allSelected = folderFiles.every((file) => selectedIds.has(file.uid));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const file of folderFiles) {
        if (allSelected) next.delete(file.uid);
        else next.add(file.uid);
      }
      return next;
    });
  }

  async function createCustomFolderFromSelection() {
    const name = newFolderName.trim();
    if (!name || selectedFiles.length === 0) return;

    setSavingFolder(true);
    try {
      const filesPayload = selectedFiles.map((file) => {
        if (file.source === "received") {
          return {
            source: "received",
            attachmentId: file.id,
          };
        }
        return { source: "sent" };
      });

      const res = await apiClient.post(`offers/${offerId}/document-folders`, {
        json: {
          name,
          parentId: null,
          files: filesPayload,
        },
      });

      if (res.ok) {
        setNewFolderName("");
        setSelectedIds(new Set());
        await loadCustomFolders();
        setExpandedIds((prev) => new Set([...prev, "custom"]));
      }
    } finally {
      setSavingFolder(false);
    }
  }

  async function deleteCustomFolder(folderId: string) {
    if (!confirm("Supprimer ce sous-dossier ?")) return;
    await apiClient.delete(`offers/${offerId}/document-folders/${folderId}`);
    await loadCustomFolders();
  }

  async function removeFileFromFolder(folderId: string, fileId: string) {
    await apiClient.delete(
      `offers/${offerId}/document-folders/${folderId}/files/${fileId}`,
    );
    await loadCustomFolders();
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function renderFolder(folder: OfferDocumentFolder, level = 0) {
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

    return (
      <div key={folder.id} className="space-y-2">
        <div
          className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2"
          style={{ marginLeft: level * 16 }}
        >
          <button
            type="button"
            onClick={() => toggleExpanded(folder.id)}
            className="w-6 text-sm"
          >
            {isExpanded ? "▾" : "▸"}
          </button>

          <input
            type="checkbox"
            checked={isFolderChecked}
            disabled={folderFiles.length === 0}
            onChange={() => toggleFolder(folder)}
          />

          <div className="flex-1">
            <p className="font-medium">{folder.name}</p>
            <p className="text-xs text-gray-500">
              {folderFiles.length} fichier(s)
              {selectedCount > 0 ? ` · ${selectedCount} sélectionné(s)` : ""}
            </p>
          </div>

          {isCustomFolder && (
            <button
              type="button"
              onClick={() => deleteCustomFolder(folder.id)}
              className="text-xs text-red-600 hover:underline"
            >
              Supprimer
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="space-y-2">
            {isEmpty && (
              <p
                className="text-sm text-gray-400"
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
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(file.uid)}
                    onChange={() => toggleFile(file)}
                  />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {file.source === "sent" ? "Envoyé" : "Reçu"}
                      {file.supplierName ? ` · ${file.supplierName}` : ""}
                      {" · "}
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://api.digitservz.dz${file.downloadUrl}`}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white"
                  >
                    Télécharger
                  </a>

                  {isCustomFolder && file.folderFileId && (
                    <button
                      type="button"
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
    return <div className="rounded-xl border bg-white p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-4 rounded-xl border bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Documents de l'offre</h2>
          <p className="text-sm text-gray-500">
            Fichiers envoyés, fichiers reçus et sélections partielles par lot.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            loadDocuments();
            loadCustomFolders();
          }}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          Actualiser
        </button>
      </div>

      <div className="rounded-lg border bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-800">
          Sélection actuelle : {selectedFiles.length} fichier(s)
        </p>

        {selectedFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nom du sous-dossier, ex: Lot 1 retenu"
              className="min-w-70 rounded-lg border px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={createCustomFolderFromSelection}
              disabled={savingFolder}
              className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {savingFolder
                ? "Création…"
                : "Créer un sous-dossier avec la sélection"}
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              Vider la sélection
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {allFolders.map((folder) => renderFolder(folder))}
      </div>
    </div>
  );
}
