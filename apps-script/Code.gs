/**
 * Code.gs — Backend opcional para registrar cada intercambio de SonIA
 * (especialmente en modo Bitácora) como una fila nueva en una Google Sheet.
 *
 * CÓMO DESPLEGARLO:
 *   1. Creá una Google Sheet nueva. Renombrá la primera hoja a "Bitacora".
 *   2. Extensiones → Apps Script. Borrá el contenido de Code.gs y pegá este archivo.
 *   3. Implementar → Nueva implementación → tipo "Aplicación web".
 *      - Ejecutar como: Yo
 *      - Quién tiene acceso: Cualquier usuario
 *   4. Copiá la URL que te da (".../exec") y pegala en SHEETS_ENDPOINT,
 *      en src/data/sonPrompt.js.
 *
 * Cada fila que llega desde SonIA trae: { ts, mode, question, response }.
 */

const SHEET_NAME = "Bitacora";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
      || SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Fecha", "Hora", "Modo", "Pregunta", "Respuesta (inicio)"]);
    }

    const ts = data.ts ? new Date(data.ts) : new Date();
    sheet.appendRow([
      Utilities.formatDate(ts, "GMT-3", "dd/MM/yyyy"),
      Utilities.formatDate(ts, "GMT-3", "HH:mm"),
      data.mode || "",
      data.question || "",
      (data.response || "").slice(0, 500),
    ]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
