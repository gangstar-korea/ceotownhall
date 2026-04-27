const SHEET_NAME = "";
const LIMIT = 50;

function doGet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = SHEET_NAME
    ? spreadsheet.getSheetByName(SHEET_NAME)
    : spreadsheet.getSheets()[0];

  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ rows: [], error: "Sheet not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map((header) => String(header).trim());
  const rows = values
    .map((row, index) => toObject(headers, row, index + 2))
    .filter((row) => isApproved(row))
    .sort((a, b) => b.sortValue - a.sortValue)
    .slice(0, LIMIT)
    .map((row) => ({
      timestamp: row.timestamp,
      name: row.name,
      team: row.team,
      title: row.title,
      message: row.message
    }));

  return ContentService
    .createTextOutput(JSON.stringify({ rows }))
    .setMimeType(ContentService.MimeType.JSON);
}

function toObject(headers, row, sheetRowNumber) {
  const object = {};
  headers.forEach((header, index) => {
    const key = normalizeHeader(header);
    object[key] = row[index] == null ? "" : String(row[index]).trim();
  });
  object.sortValue = timestampToSortValue(object.timestamp, sheetRowNumber);
  return object;
}

function timestampToSortValue(timestamp, sheetRowNumber) {
  const parsed = timestamp ? new Date(timestamp).getTime() : NaN;
  if (!Number.isNaN(parsed)) return parsed;
  return sheetRowNumber;
}

function normalizeHeader(header) {
  const map = {
    "Timestamp": "timestamp",
    "타임스탬프": "timestamp",
    "이름": "name",
    "name": "name",
    "소속": "team",
    "team": "team",
    "직책": "title",
    "title": "title",
    "댓글 / 질문": "message",
    "댓글": "message",
    "질문": "message",
    "message": "message",
    "화면 노출 동의": "approved",
    "노출 동의": "approved",
    "approved": "approved"
  };
  return map[header] || header;
}

function isApproved(row) {
  if (!row.message) return false;
  if (!row.approved) return true;
  return ["예", "yes", "y", "true", "동의"].includes(String(row.approved).toLowerCase());
}
