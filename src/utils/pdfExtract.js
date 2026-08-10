// ─────────────────────────────────────────────────────────────────────────────
// pdfExtract.js — Lectura de guion en PDF, 100% en el navegador (pdf.js).
// No hay backend: el PDF nunca sale de la máquina del usuario.
// ─────────────────────────────────────────────────────────────────────────────
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

/** Reconstruye el texto de una página respetando saltos de línea reales,
 *  usando la posición Y de cada fragmento (pdf.js no da líneas, da fragmentos
 *  sueltos con coordenadas). */
async function pageToText(page) {
  const content = await page.getTextContent();
  let text = "";
  let lastY = null;
  for (const item of content.items) {
    const y = item.transform[5];
    if (lastY !== null && Math.abs(y - lastY) > 2) {
      text += "\n";
    } else if (text && !/[\s\n]$/.test(text)) {
      text += " ";
    }
    text += item.str;
    lastY = y;
  }
  return text;
}

/** @param {File} file  @returns {Promise<{fullText:string, pageCount:number}>} */
export async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageTexts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    pageTexts.push(await pageToText(await pdf.getPage(i)));
  }
  return { fullText: pageTexts.join("\n\n"), pageCount: pdf.numPages };
}
