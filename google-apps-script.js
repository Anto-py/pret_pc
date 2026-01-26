// Google Apps Script - à coller dans Extensions > Apps Script
// Version adaptée pour multi-équipements (PC, HDMI, Calculatrices, etc.)
//
// IMPORTANT: Les colonnes de vos feuilles Google Sheets doivent être:
// - Feuille "Prets": id | sigle | type | nb | retournes | heure | timestamp
// - Feuille "Historique": id | timestamp | sigle | action | actionType

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pretsSheet = ss.getSheetByName("Prets");
  const histoSheet = ss.getSheetByName("Historique");

  const action = e.parameter.action;

  try {
    let result;

    switch(action) {
      case "load":
        result = loadData(pretsSheet, histoSheet);
        break;
      case "save":
        const data = JSON.parse(e.parameter.data);
        result = saveData(pretsSheet, histoSheet, data);
        break;
      default:
        result = { error: "Action inconnue" };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function loadData(pretsSheet, histoSheet) {
  const pretsData = pretsSheet.getDataRange().getValues();
  const histoData = histoSheet.getDataRange().getValues();

  // Ignorer les headers
  // Colonnes Prets: id | sigle | type | nb | retournes | heure | timestamp
  const prets = pretsData.slice(1).filter(row => row[0]).map(row => ({
    id: row[0],
    sigle: row[1],
    type: row[2],
    nb: row[3],
    retournes: row[4],
    heure: row[5],
    timestamp: row[6]
  }));

  // Colonnes Historique: id | timestamp | sigle | action | actionType
  const historique = histoData.slice(1).filter(row => row[0]).map(row => ({
    id: row[0],
    timestamp: row[1],
    sigle: row[2],
    action: row[3],
    actionType: row[4]
  }));

  return { pretsActifs: prets, historique: historique };
}

function saveData(pretsSheet, histoSheet, data) {
  // Effacer les données existantes (garder headers)
  const pretsLastRow = pretsSheet.getLastRow();
  if (pretsLastRow > 1) {
    pretsSheet.getRange(2, 1, pretsLastRow - 1, 7).clearContent();
  }

  const histoLastRow = histoSheet.getLastRow();
  if (histoLastRow > 1) {
    histoSheet.getRange(2, 1, histoLastRow - 1, 5).clearContent();
  }

  // Écrire les prêts actifs
  // Colonnes: id | sigle | type | nb | retournes | heure | timestamp
  if (data.pretsActifs && data.pretsActifs.length > 0) {
    const pretsValues = data.pretsActifs.map(p => [
      p.id, p.sigle, p.type, p.nb, p.retournes, p.heure, p.timestamp
    ]);
    pretsSheet.getRange(2, 1, pretsValues.length, 7).setValues(pretsValues);
  }

  // Écrire l'historique
  // Colonnes: id | timestamp | sigle | action | actionType
  if (data.historique && data.historique.length > 0) {
    const histoValues = data.historique.map(h => [
      h.id, h.timestamp, h.sigle, h.action, h.actionType
    ]);
    histoSheet.getRange(2, 1, histoValues.length, 5).setValues(histoValues);
  }

  return { success: true };
}
