// src/pages/Auth/LoginPage.tsx
import { useState } from "react";
//import { useNavigate } from "react-router";
//
//import { toast } from "sonner";
//import { Lock, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/hooks/useAuth";

export function LoginPage() {
  //const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const errorMessage = await login(credentials.email, credentials.password);

      // Si le store renvoie un message d'erreur, on l'affiche
      if (errorMessage) {
        setError(errorMessage);
      }
      // Sinon, c'est que le login a réussi, le state isAuthenticated s'est mis à jour
    } catch (err: any) {
      setError("Une erreur inattendue est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">FK PHARM</h1>
          <p className="text-gray-500 mt-2">Gestion des offres fournisseurs</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-6">Connexion</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Label>email</Label>
            <Input
              value={credentials.email}
              onChange={(e: any) =>
                setCredentials((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="Entrez votre identifiant"
              required
            />
            <Label>Mot de passe</Label>
            <Input
              type="password"
              value={credentials.password}
              onChange={(e: any) =>
                setCredentials((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              placeholder="Entrez votre mot de passe"
              required
            />

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
