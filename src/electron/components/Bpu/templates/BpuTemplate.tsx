import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Enregistrement de polices supportant les accents (Optionnel mais recommandé pour l'arabe/français)
// Font.register({ family: 'Arial', src: '...' });

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    paddingTop: 30,
    paddingLeft: 30,
    paddingRight: 30,
    lineHeight: 1.5,
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a8a", // Bleu Foncé
    paddingBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    textTransform: "uppercase",
  },
  table: {
    display: "flex",
    width: "100%",
    textAlign: "center",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#b0b0b0",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    width: "10%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#b0b0b0",
    backgroundColor: "#1e3a8a",
    color: "white",
    padding: 4,
  },
  tableCol: {
    width: "10%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#b0b0b0",
    padding: 4,
  },
  // Surcharge pour la colonne Désignation (plus large)
  colDesignation: {
    width: "40%",
  },
});

// Interface pour les données attendues
interface BpuItem {
  reference: string;
  designation: string;
  quantity: number;
  unitPrice: number;
}

interface BpuTemplateProps {
  projectTitle: string;
  items: BpuItem[];
}

const BpuTemplate: React.FC<BpuTemplateProps> = ({ projectTitle, items }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <Text>République Algérienne Démocratique et Populaire</Text>
          <Text>Ministère de la Santé</Text>
        </View>
        <View>
          <Text>FK PHARM</Text>
          <Text>Date : 09/04/2026</Text>
        </View>
      </View>

      {/* Titre du projet */}
      <Text style={styles.title}>Bordereau de Prix Unitaires (BPU)</Text>
      <Text style={{ marginBottom: 10, fontSize: 11 }}>
        Projet : {projectTitle}
      </Text>

      {/* Tableau des données */}
      <View style={styles.table}>
        {/* En-tête du tableau */}
        <View style={styles.tableRow}>
          <Text style={[styles.tableColHeader, { width: "10%" }]}>N°</Text>
          <Text style={[styles.tableColHeader, { width: "15%" }]}>
            Référence
          </Text>
          <Text style={[styles.tableColHeader, styles.colDesignation]}>
            Désignation
          </Text>
          <Text style={[styles.tableColHeader, { width: "10%" }]}>
            Quantité
          </Text>
          <Text style={[styles.tableColHeader, { width: "15%" }]}>
            P.U. (DA)
          </Text>
          <Text style={[styles.tableColHeader, { width: "10%" }]}>
            Total (DA)
          </Text>
        </View>

        {/* Lignes de données */}
        {items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCol, { width: "10%" }]}>{index + 1}</Text>
            <Text style={[styles.tableCol, { width: "15%" }]}>
              {item.reference}
            </Text>
            <Text style={[styles.tableCol, styles.colDesignation]}>
              {item.designation}
            </Text>
            <Text style={[styles.tableCol, { width: "10%" }]}>
              {item.quantity}
            </Text>
            <Text style={[styles.tableCol, { width: "15%" }]}>
              {item.unitPrice.toLocaleString("fr-FR")}
            </Text>
            <Text style={[styles.tableCol, { width: "10%" }]}>
              {(item.quantity * item.unitPrice).toLocaleString("fr-FR")}
            </Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default BpuTemplate;
