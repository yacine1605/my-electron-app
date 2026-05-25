import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

const API_BASE_URL = "https://api.digitservz.dz";

type DocumentFolder = {
  id: string;
  name: string;
  parentId: string | null;
  offerId: string;
  offerTitle: string;
  offerStatus: string;
  fileCount: number;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  pending: "En attente",
  sent: "Envoyée",
  completed: "Terminée",
  failed: "Échouée",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-700",
  sent: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function DocumentFoldersListPage() {
  const navigate = useNavigate();

  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "files">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadFolders();
  }, []);

  async function loadFolders() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/offers/document-folders`);
      const json = await res.json();
      if (json.success) {
        setFolders(json.data);
      }
    } catch (e) {
      console.error("Erreur chargement dossiers", e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let list = folders;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.offerTitle.toLowerCase().includes(q),
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === "files") {
        cmp = a.fileCount - b.fileCount;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [folders, search, sortBy, sortDir]);

  function toggleSort(field: "date" | "name" | "files") {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
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
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                Sous-dossiers créés
              </h1>
              <p className="text-sm text-gray-500">
                {folders.length} dossier(s) au total
              </p>
            </div>
            <button
              onClick={loadFolders}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un dossier ou une offre…"
              className="min-w-[280px] rounded-lg border px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-500">Trier par :</span>
              {(["date", "name", "files"] as const).map((field) => (
                <button
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                    sortBy === field
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {field === "date" && "Date"}
                  {field === "name" && "Nom"}
                  {field === "files" && "Fichiers"}
                  {sortBy === field && (sortDir === "asc" ? " ↑" : " ↓")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-gray-200"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
            <p className="text-lg font-medium">Aucun sous-dossier trouvé</p>
            <p className="mt-1 text-sm">
              {search.trim()
                ? "Aucun résultat pour votre recherche."
                : "Créez un sous-dossier depuis la page Documents d'une offre."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((folder) => (
              <div
                key={folder.id}
                className="rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900">
                        {folder.name}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[folder.offerStatus] || "bg-gray-100 text-gray-700"}`}
                      >
                        {statusLabels[folder.offerStatus] || folder.offerStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Offre :{" "}
                      <span className="font-medium text-gray-700">
                        {folder.offerTitle}
                      </span>
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                      <span>
                        {folder.fileCount} fichier
                        {folder.fileCount > 1 ? "s" : ""}
                      </span>
                      <span>
                        Créé le{" "}
                        {new Date(folder.createdAt).toLocaleDateString(
                          "fr-DZ",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/offer/liste/${folder.offerId}`)}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      Voir l’offre
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/offer/liste/${folder.offerId}/documents`)
                      }
                      className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Documents
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
