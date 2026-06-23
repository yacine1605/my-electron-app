import { PDFDocument } from "pdf-lib";

/**
 * Compresse un PDF en supprimant les métadonnées et optimisant la structure.
 * NOTE : Pour les PDFs scannés (images), pdf-lib ne compresse pas les images.
 * Dans ce cas, utilisez extractDqePages() pour réduire drastiquement.
 */
export async function compressPdf(file: File): Promise<File> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Supprimer les métadonnées lourdes
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");

    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      preserveExistingEncryption: false,
    });

    const compressedFile = new File(
      [compressedBytes],
      file.name.replace(".pdf", "_compressed.pdf"),
      { type: "application/pdf" },
    );

    const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(0);
    console.log(
      `[PDF] ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${reduction}% réduction)`,
    );

    return compressedFile;
  } catch (err) {
    console.warn("[PDF Compression] Failed, using original:", err);
    return file;
  }
}

/**
 * Extrait UNIQUEMENT les pages contenant "DETAIL QUANTITATIF ET ESTIMATIF".
 * C'est la solution la plus efficace pour les gros PDFs scannés.
 *
 * Stratégie : Les DQE sont généralement les 4-8 dernières pages du document.
 */
export async function extractDqePages(file: File): Promise<File | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = pdfDoc.getPageCount();

    if (totalPages <= 8) {
      // Document court, pas besoin d'extraire
      return null;
    }

    // Heuristique : Les DQE sont dans les 30% finaux du document
    // On prend les 6 dernières pages par défaut (souvent 1-2 pages DQE par lot)
    const dqePageCount = Math.min(6, Math.floor(totalPages * 0.3));
    const startIndex = totalPages - dqePageCount;

    const indices = Array.from(
      { length: dqePageCount },
      (_, i) => startIndex + i,
    );

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdfDoc, indices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const bytes = await newPdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const dqeFile = new File(
      [bytes],
      file.name.replace(".pdf", "_DQE_only.pdf"),
      { type: "application/pdf" },
    );

    console.log(
      `[DQE Extract] ${totalPages} pages → ${dqePageCount} pages | ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(dqeFile.size / 1024 / 1024).toFixed(2)}MB`,
    );

    return dqeFile;
  } catch (err) {
    console.warn("[DQE Extract] Failed:", err);
    return null;
  }
}

/**
 * Détecte si un PDF est probablement scanné (image-based) via le ratio taille/page.
 * Un PDF texte : ~10-100KB/page. Un PDF scanné : ~200KB-5MB/page.
 */
export function isScannedPdf(file: File, pageCount?: number): boolean {
  if (!pageCount || pageCount === 0) {
    // Estimation : si > 3MB sans connaître les pages, probablement scanné
    return file.size > 3 * 1024 * 1024;
  }
  const sizePerPage = file.size / pageCount;
  return sizePerPage > 150 * 1024; // > 150KB/page = scanné
}

/**
 * Pipeline complet : compresse puis extrait DQE si nécessaire.
 * Retourne le fichier le plus petit possible.
 */
export async function optimizePdfForUpload(file: File): Promise<{
  file: File;
  strategy: "original" | "compressed" | "dqe_extracted";
}> {
  // Étape 1 : Compression structurelle
  const compressed = await compressPdf(file);

  // Si déjà petit, on garde
  if (compressed.size <= 5 * 1024 * 1024) {
    return {
      file: compressed,
      strategy: compressed === file ? "original" : "compressed",
    };
  }

  // Étape 2 : Extraction DQE pour les gros fichiers
  const dqeFile = await extractDqePages(compressed);

  if (dqeFile && dqeFile.size < compressed.size * 0.5) {
    // Si on a réduit de plus de 50%, c'est un succès
    return { file: dqeFile, strategy: "dqe_extracted" };
  }

  // Fallback : retourner le compressé
  return { file: compressed, strategy: "compressed" };
}
