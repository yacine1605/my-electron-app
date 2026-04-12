import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ComptabiliteModule() {
  return (
    <div className="m-6 space-y-6">
      {/* Résumé financier en cartes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Factures En Attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Montant total : 4 500 000 DA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Paiements En Retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">3</div>
            <p className="text-xs text-muted-foreground">
              Pénalités potentielles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets pour séparer Factures et Échéances */}
      <Tabs defaultValue="factures" className="space-y-4">
        <TabsList>
          <TabsTrigger value="factures">Suivi des Factures</TabsTrigger>
          <TabsTrigger value="echeances">Calendrier des Échéances</TabsTrigger>
        </TabsList>
        <TabsContent value="factures" className="space-y-4">
          {/* Ici, un autre composant Table de shadcn listant les factures */}
          <div className="border rounded-md p-4 bg-card">
            Tableau des factures ici...
          </div>
        </TabsContent>
        <TabsContent value="echeances" className="space-y-4">
          {/* Ici, intégration d'un calendrier ou liste triée par date */}
          <div className="border rounded-md p-4 bg-card">
            Calendrier des échéances ici...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
