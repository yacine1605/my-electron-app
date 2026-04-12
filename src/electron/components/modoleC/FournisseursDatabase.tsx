import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Type fictif pour l'exemple
type Fournisseur = {
  id: string;
  nom: string;
  categorie: string;
  contact: string;
  nombreOffres: number;
  statutPaiement: "À jour" | "En retard" | "En attente";
};

const mockFournisseurs: Fournisseur[] = [
  {
    id: "1",
    nom: "MedEquip Algeria",
    categorie: "Équipements Lourds",
    contact: "contact@medequip.dz",
    nombreOffres: 14,
    statutPaiement: "À jour",
  },
  {
    id: "2",
    nom: "Sarl PharmaTech",
    categorie: "Consommables",
    contact: "ventes@pharmatech.dz",
    nombreOffres: 5,
    statutPaiement: "En retard",
  },
  {
    id: "3",
    nom: "Global Medical SA",
    categorie: "Équipements Lourds",
    contact: "info@globalmed.com",
    nombreOffres: 22,
    statutPaiement: "En attente",
  },
];

export default function FournisseursDatabase() {
  const [search, setSearch] = useState("");

  const filteredFournisseurs = mockFournisseurs.filter((f) =>
    f.nom.toLowerCase().includes(search.toLowerCase()),
  );

  // Fonction pour la couleur du Badge selon le statut
  const getStatutVariant = (statut: Fournisseur["statutPaiement"]) => {
    switch (statut) {
      case "À jour":
        return "default"; // Ou une variante personnalisée verte
      case "En retard":
        return "destructive";
      case "En attente":
        return "secondary";
    }
  };

  return (
    <Card className="m-6 shadow-none border-0 bg-background">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold tracking-tight">
          Base de Données Fournisseurs
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Rechercher un fournisseur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button>+ Ajouter Fournisseur</Button>
        </div>
        <h1 className="page-title">Suppliers</h1>
        <div className="btn-group">
          <Button variant="default">Add</Button>
          <Button>Import CSV</Button>
          <Button>Refresh</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>
            Liste de tous les fournisseurs enregistrés localement.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-62.5">Nom du Fournisseur</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Historique Offres</TableHead>
              <TableHead className="text-center">Statut Comptable</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFournisseurs.map((fournisseur) => (
              <TableRow key={fournisseur.id}>
                <TableCell className="font-medium">{fournisseur.nom}</TableCell>
                <TableCell>
                  <Badge variant="outline">{fournisseur.categorie}</Badge>
                </TableCell>
                <TableCell>{fournisseur.contact}</TableCell>
                <TableCell className="text-center">
                  {fournisseur.nombreOffres} offres
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={getStatutVariant(fournisseur.statutPaiement)}>
                    {fournisseur.statutPaiement}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Détails
                  </Button>
                  <Button variant="ghost" size="sm">
                    Archives
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
