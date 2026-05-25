import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Définir l'URL de l'API locale
const API_URL = import.meta.env.VITE_API_BASE_URL; // e.g. "http://localhost:3001" ou "" si proxy

const HistoryList = () => {
  const [history, setHistory] = useState<any[]>([]); // Remplacez any par votre type BpuDocument
  const [loading, setLoading] = useState(true);

  // Appel HTTP au backend au chargement du composant
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/bpu-history`);
        const data = await response.json();
        setHistory(data);
      } catch (error) {
        console.error("Erreur de fetch:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) return <p>Chargement de l'historique...</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Historique des générations</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>N° Document</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {new Date(item.createdAt).toLocaleDateString("fr-FR")}
              </TableCell>
              <TableCell className="font-medium">{item.docNumber}</TableCell>
              <TableCell>
                <Badge variant="outline">{item.docType}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    item.status === "validated" ? "default" : "secondary"
                  }
                >
                  {item.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default HistoryList;
