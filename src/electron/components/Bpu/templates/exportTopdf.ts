export const exportToPDF = (comparisonResult: {
  suppliers: any[];
  comparisonCriteria: any[];
  winner: string;
  winnerReason: string;
  recommendation: string;
  coherenceIssues: string[];
}) => {
  if (!comparisonResult) return;
  const {
    suppliers,
    comparisonCriteria,
    winner,
    winnerReason,
    recommendation,
    coherenceIssues,
  } = comparisonResult;

  const winnerSupplier = suppliers.find(
    (s) => s.label === winner || s.supplierName === winner,
  );

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Rapport FK PHARM</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; margin: 2cm; color: #1a1a1a; }
  h1 { font-size: 18px; text-align: center; color: #185FA5; margin-bottom: 4px; }
  h2 { font-size: 13px; color: #185FA5; border-bottom: 1px solid #B5D4F4; padding-bottom: 4px; margin: 20px 0 10px; }
  .header { text-align: center; border: 1.5px solid #185FA5; padding: 14px; margin-bottom: 24px; border-radius: 6px; }
  .header p { margin: 3px 0; color: #444; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 11px; }
  th { background: #185FA5; color: white; padding: 7px 9px; text-align: left; }
  td { padding: 6px 9px; border-bottom: 0.5px solid #ddd; }
  tr:nth-child(even) td { background: #f5f8fc; }
  .winner-row td { font-weight: bold; background: #EAF3DE !important; }
  .best { color: #3B6D11; font-weight: bold; }
  .worst { color: #A32D2D; }
  .rec { background: #E6F1FB; border: 1px solid #B5D4F4; border-radius: 5px; padding: 10px 14px; margin: 10px 0; }
  .warn { background: #FAEEDA; border: 1px solid #FAC775; border-radius: 5px; padding: 8px 12px; margin: 8px 0; font-size: 11px; }
  .score-grid { display: flex; gap: 12px; margin-bottom: 18px; }
  .score-card { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 10px; text-align: center; }
  .score-card .val { font-size: 22px; font-weight: bold; color: #185FA5; }
  .score-card .lbl { font-size: 10px; color: #666; margin-bottom: 4px; }
  .score-card.best-card { border-color: #97C459; background: #EAF3DE; }
  .score-card.best-card .val { color: #3B6D11; }
  .footer { margin-top: 28px; font-size: 9px; color: #aaa; text-align: center; border-top: 0.5px solid #ddd; padding-top: 8px; }
  @media print { body { margin: 1.5cm; } }
</style></head><body>
<div class="header">
  <h1>Rapport de comparaison — Offres fournisseurs</h1>
  <p><strong>FK PHARM</strong> · Date : ${new Date().toLocaleDateString("fr-FR")}</p>
  <p>Fournisseurs analysés : ${suppliers.map((s) => s.label + " (" + s.supplierName + ")").join(" · ")}</p>
</div>

${coherenceIssues.length ? `<div class="warn">⚠ Anomalies détectées : ${coherenceIssues.join(", ")}</div>` : ""}

<div class="rec"><strong>★ Fournisseur recommandé : ${winner}</strong><br>${winnerReason}</div>

<h2>Scores par fournisseur</h2>
<div class="score-grid">
${suppliers
  .map(
    (s) => `
  <div class="score-card ${s.label === winner || s.supplierName === winner ? "best-card" : ""}">
    <div class="lbl">${s.label}</div>
    <div class="val">${s.score}<span style="font-size:12px;font-weight:normal;color:#666">/100</span></div>
    <div style="font-size:10px;color:#555">${s.supplierName}</div>
    ${s.label === winner || s.supplierName === winner ? '<div style="font-size:10px;color:#3B6D11;font-weight:bold">★ Recommandé</div>' : ""}
  </div>`,
  )
  .join("")}
</div>

<h2>Tableau de comparaison</h2>
<table>
<tr><th>Critère</th>${suppliers.map((s) => `<th>${s.label}</th>`).join("")}</tr>
${comparisonCriteria
  .map(
    (c) =>
      `<tr><td><strong>${c.criterion}</strong></td>${c.values
        .map(
          (v: any, i: any) =>
            `<td class="${i === c.bestIndex ? "best" : ""}">${v}</td>`,
        )
        .join("")}</tr>`,
  )
  .join("")}
</table>

${
  winnerSupplier?.products?.length
    ? `<h2>Détail produits — ${winner}</h2>
<table>
<tr><th>Référence</th><th>Désignation</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr>
${winnerSupplier.products
  .map(
    (p: {
      ref: any;
      designation: any;
      qty: any;
      unitPrice: { toLocaleString: (arg0: string) => any };
      total: { toLocaleString: (arg0: string) => any };
    }) =>
      `<tr><td>${p.ref}</td><td>${p.designation}</td><td>${p.qty}</td><td>${p.unitPrice.toLocaleString("fr-FR")} ${winnerSupplier.currency}</td><td>${p.total.toLocaleString("fr-FR")} ${winnerSupplier.currency}</td></tr>`,
  )
  .join("")}
<tr class="winner-row"><td colspan="4">Total général</td><td>${winnerSupplier.totalPrice.toLocaleString("fr-FR")} ${winnerSupplier.currency}</td></tr>
</table>`
    : ""
}

<h2>Recommandation IA</h2>
<div class="rec">${recommendation}</div>

<div class="footer">Généré automatiquement par FK PHARM — Système d'analyse des offres fournisseurs · ${new Date().toLocaleString("fr-FR")}</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  win?.print();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};
