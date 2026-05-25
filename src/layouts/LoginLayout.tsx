import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/hooks/useAuth";
import { useNavigate } from "react-router";

const ROLE_HOME: Record<string, string> = {
  accountant: "/dashboard",
  agent_commercial: "/dashboard",
  technique: "/technique/dashboard",
  admin: "/admin",
  distributor: "/distributor/dashboard",
};

export function LoginPage() {
  const navigate = useNavigate();

  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.role);
  const hasHydrated = useAuthStore((state) => state.hasHydrated); // ← attendre la réhydratation

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  // Redirection si déjà authentifié (après réhydratation ou login)
  useEffect(() => {
    if (!hasHydrated) return; // ← attendre que persist ait restauré le store

    if (isAuthenticated && userRole) {
      const target = ROLE_HOME[userRole];
      if (target) {
        navigate(target, { replace: true });
      }
    }
  }, [hasHydrated, isAuthenticated, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const errorMessage = await login(credentials.email, credentials.password);
      if (errorMessage) {
        setError(errorMessage);
      }
      // Le useEffect ci-dessus gère la redirection sur isAuthenticated=true
    } catch {
      setError("Une erreur inattendue est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  // Optionnel : empêcher l'affichage du formulaire pendant la réhydratation
  // pour éviter le flash de login au F5
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-blue-700 font-semibold">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">FK PHARM</h1>
          <p className="text-gray-500 mt-2">Gestion des offres fournisseurs</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-6">Connexion</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="Entrez votre email"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                placeholder="Entrez votre mot de passe"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          FK PHARM © 2026 — Application Desktop
        </p>
      </div>
    </div>
  );
}
