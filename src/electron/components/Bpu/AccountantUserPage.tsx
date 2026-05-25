import { useEffect } from "react";
import { useAuthStore } from "@/lib/hooks/useAuth";

// Status helpers (add these if missing in your file)

export default function AccountProfilPage() {
  const { user, logout, fetchUser, isAuthenticated, hasHydrated } =
    useAuthStore();

  useEffect(() => {
    if (isAuthenticated && hasHydrated) {
      fetchUser();
    }
  }, [isAuthenticated, hasHydrated, fetchUser]);

  function handleLogout() {
    logout();
    // Optional: navigate("/login");
  }

  // Derive display values from backend user data
  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : "Utilisateur";
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "??";
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-DZ", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  if (!user) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-slate-400">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {console.log(user)}
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-xl font-semibold text-blue-800">
                  {initials}
                </span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  {displayName}
                </h1>
                <p className="text-sm text-slate-500 capitalize">
                  Agent {user.role.replace("_", " ")}
                </p>
                <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  FK Pharm
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Déconnexion
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 mt-5 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                ),
                label: "Email",
                value: user.email,
              },
              {
                icon: (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                ),
                label: "Téléphone",
                value: user.phone || "—",
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400">{label}</p>
                  <p className="text-sm text-slate-700 truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {joinedDate && (
            <p className="text-[11px] text-slate-400 mt-4">
              Membre depuis le {joinedDate}
            </p>
          )}
        </div>

        {/* Recent offers */}
      </div>
    </>
  );
}
