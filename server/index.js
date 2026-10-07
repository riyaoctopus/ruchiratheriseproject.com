import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import crypto from "node:crypto";
import { submitLead, LEADS_XLSX } from "./services/crm.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "..", "dist");
const PORT = process.env.PORT || 4000;

// Lightweight shared-secret gate for the leads export download — not a full
// auth system, but enough to stop the lead list (names/emails/phones) from
// sitting on a bare, guessable, unauthenticated URL. Set LEADS_EXPORT_KEY in
// the environment for a stable value in production; otherwise a random key
// is generated per process start and printed to the server log.
const LEADS_EXPORT_KEY = process.env.LEADS_EXPORT_KEY || crypto.randomBytes(12).toString("hex");

const app = express();
app.use(express.json({ limit: "20kb" }));

const CONFIGURATIONS = new Set([
  "2 BHK",
  "3 BHK",
  "3.5 BHK",
  "4 BHK",
  "Duplex",
  "Not sure yet",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+().\s-]{7,20}$/;

app.post("/api/leads", async (req, res) => {
  const { name, email, phone, configuration, message } = req.body ?? {};

  const errors = [];
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push("A valid name is required.");
  }
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    errors.push("A valid email is required.");
  }
  if (!phone || typeof phone !== "string" || !PHONE_RE.test(phone.trim())) {
    errors.push("A valid phone number is required.");
  }
  if (configuration && !CONFIGURATIONS.has(configuration)) {
    errors.push("Unrecognised configuration.");
  }

  if (errors.length) {
    return res.status(400).json({ ok: false, errors });
  }

  try {
    await submitLead({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      configuration: configuration || "Not sure yet",
      message: typeof message === "string" ? message.trim().slice(0, 1000) : "",
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to record lead:", err);
    res.status(500).json({ ok: false, errors: ["Something went wrong. Please call or WhatsApp us instead."] });
  }
});

app.get("/api/leads/export", (req, res) => {
  if (req.query.key !== LEADS_EXPORT_KEY) {
    return res.status(404).send("Not found");
  }
  if (!existsSync(LEADS_XLSX)) {
    return res.status(404).send("No leads recorded yet.");
  }
  res.download(LEADS_XLSX, "the-rise-leads.xlsx");
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(DIST_DIR));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
  console.log(`Leads export: http://localhost:${PORT}/api/leads/export?key=${LEADS_EXPORT_KEY}`);
});
