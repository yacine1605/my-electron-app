import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Interface fictive pour les données extraites
interface ExtractedItem {
  id: string;
  reference: string;
  designation: string;
  quantity: number;
  unitPrice: number;
  isConsistent: boolean; // Vérification prix/quantités
}

interface DataMapperProps {
  onNext: () => void;
}

const DataMapper: React.FC<DataMapperProps> = ({ onNext }) => {
  // Données de test simulant l'extraction de l'Agent IA
  const mappedData: ExtractedItem[] = [
    {
      id: "1",
      reference: "MED-XYZ-01",
      designation: "Moniteur patient",
      quantity: 5,
      unitPrice: 250000,
      isConsistent: true,
    },
    {
      id: "2",
      reference: "MED-ABC-02",
      designation: "Pousse seringue",
      quantity: 10,
      unitPrice: 85000,
      isConsistent: false,
    }, // Incohérence détectée
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapping des données et Vérification</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Réf.</TableHead>
                <TableHead>Désignation</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Prix Unitaire (DA)</TableHead>
                <TableHead>Statut Cohérence</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappedData.map((item) => (
                <TableRow
                  key={item.id}
                  className={!item.isConsistent ? "bg-red-50" : ""}
                >
                  <TableCell className="font-medium">
                    {item.reference}
                  </TableCell>
                  <TableCell>{item.designation}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      defaultValue={item.quantity}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      defaultValue={item.unitPrice}
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell>
                    {item.isConsistent ? (
                      <Badge
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Valide
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Incohérence</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Corriger
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end mt-6 space-x-4">
          <Button variant="outline">Lancer la vérification IA</Button>
          <Button onClick={onNext}>Valider et Générer l'aperçu</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataMapper;
