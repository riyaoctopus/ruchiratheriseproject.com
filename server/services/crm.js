import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.jsonl");
export const LEADS_XLSX = path.join(DATA_DIR, "leads.xlsx");

const SHEET_NAME = "Leads";
// Plain arrays, not ExcelJS's object-key column mapping: ExcelJS does not
// persist column `key`s through a save/reload cycle, so building rows from
// `record[key]` silently drops data after the first append. Positional
// arrays survive round-tripping through the file correctly.
const COLUMN_HEADERS = ["Received At", "Name", "Email", "Phone", "Configuration", "Message", "Source"];
const COLUMN_KEYS = ["receivedAt", "name", "email", "phone", "configuration", "message", "source"];
const COLUMN_WIDTHS = [22, 24, 28, 18, 16, 42, 26];

// Serializes Excel read-modify-write cycles so two near-simultaneous
// submissions can't race and corrupt the workbook.
let writeQueue = Promise.resolve();
function serialize(task) {
  const next = writeQueue.then(task, task);
  writeQueue = next.catch(() => {});
  return next;
}

async function appendToExcel(record) {
  const workbook = new ExcelJS.Workbook();
  let sheet;

  try {
    await workbook.xlsx.readFile(LEADS_XLSX);
    sheet = workbook.getWorksheet(SHEET_NAME);
  } catch {
    // No workbook on disk yet — we'll create one below.
  }

  if (!sheet) {
    sheet = workbook.addWorksheet(SHEET_NAME);
    sheet.addRow(COLUMN_HEADERS);
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach((col, i) => {
      col.width = COLUMN_WIDTHS[i];
    });
  }

  sheet.addRow(COLUMN_KEYS.map((key) => record[key] ?? ""));

  await workbook.xlsx.writeFile(LEADS_XLSX);
}

/**
 * submitLead(payload) is where every enquiry from the site lands.
 *
 * For now, leads are captured into a local Excel workbook
 * (server/data/leads.xlsx) that the sales team can open directly or that
 * this app serves via GET /api/leads/export. A raw .jsonl copy is kept
 * alongside it as an append-only audit trail.
 *
 * Once Zoho CRM endpoints/credentials are supplied, add that push here too,
 * e.g.:
 *
 *   const token = await getZohoAccessToken();
 *   const res = await fetch(`${ZOHO_API_DOMAIN}/crm/v6/Leads`, {
 *     method: "POST",
 *     headers: {
 *       Authorization: `Zoho-oauthtoken ${token}`,
 *       "Content-Type": "application/json",
 *     },
 *     body: JSON.stringify({ data: [mapToZohoLead(payload)] }),
 *   });
 */
export async function submitLead(payload) {
  await mkdir(DATA_DIR, { recursive: true });

  const record = {
    ...payload,
    source: "therisebyruchira-microsite",
    receivedAt: new Date().toISOString(),
  };

  await appendFile(LEADS_FILE, JSON.stringify(record) + "\n", "utf8");
  await serialize(() => appendToExcel(record));

  return { ok: true };
}
