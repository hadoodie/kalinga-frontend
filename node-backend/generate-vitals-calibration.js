import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Client } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Missing DATABASE_URL in node-backend/.env");
  process.exit(1);
}

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const idx = args.indexOf(flag);
  if (idx === -1 || !args[idx + 1]) return fallback;
  return args[idx + 1];
};

const count = Number(getArg("--count", "10"));
const format = getArg("--format", "json");
const output = getArg(
  "--output",
  path.resolve(__dirname, "vitals_calibration." + (format === "csv" ? "csv" : "json"))
);
const userTableOverride = getArg("--user-table", "");
const userIdColumnOverride = getArg("--user-id-column", "");
const userNameColumnOverride = getArg("--user-name-column", "");

const testUsers = Array.from({ length: count }, (_, i) => `Test User${i + 1}`);

const seededRandom = (seed) => {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(31, h) + seed.charCodeAt(i);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
};

const pickColumn = (columns, names) =>
  columns.find((c) => names.includes(c.column_name))?.column_name || null;

const normalizeType = (dataType) => String(dataType || "").toLowerCase();

const formatTimestamp = (date, dataType) => {
  const t = normalizeType(dataType);
  if (t.includes("date") && !t.includes("timestamp")) {
    return date.toISOString().slice(0, 10);
  }
  return date.toISOString();
};

const main = async () => {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const { rows: columns } = await client.query(
    `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'vitals'
      ORDER BY ordinal_position
    `
  );

  if (!columns.length) {
    console.error("No columns found for public.vitals");
    await client.end();
    process.exit(1);
  }

  const timestampCol = pickColumn(columns, [
    "timestamp",
    "created_at",
    "recorded_at",
    "measured_at",
    "captured_at",
  ]);
  const esiCol = pickColumn(columns, ["esi_level", "esi", "triage_level", "triage_score"]);
  const tempCol = pickColumn(columns, ["temperature", "temp", "body_temp", "temp_c"]);
  const spo2Col = pickColumn(columns, ["spo2", "oxygen_saturation", "o2_sat"]);
  const bpmCol = pickColumn(columns, ["bpm", "heart_rate", "pulse"]);
  const deviceCol = pickColumn(columns, ["device", "device_name", "device_type", "source", "origin"]);
  const userIdCol = pickColumn(columns, ["user_id", "responder_id", "patient_id", "profile_id"]);
  const userNameCol = pickColumn(columns, [
    "user_name",
    "patient_name",
    "responder_name",
    "name",
  ]);

  let userIds = [];
  if (userIdCol) {
    const candidates = userTableOverride
      ? [userTableOverride]
      : ["users", "profiles", "responders", "patients", "responder_profiles"];

    for (const table of candidates) {
      const { rows: tables } = await client.query(
        `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        `,
        [table]
      );
      if (!tables.length) continue;

      const idCol = userIdColumnOverride || "id";
      const nameCol = userNameColumnOverride || "name";
      try {
        const { rows } = await client.query(
          `SELECT ${idCol} AS id, ${nameCol} AS name FROM ${table} LIMIT $1`,
          [count]
        );
        if (rows.length) {
          userIds = rows.map((r) => ({ id: r.id, name: r.name }));
          break;
        }
      } catch {
        // ignore and try next table
      }
    }
  }

  const rows = testUsers.map((name, idx) => {
    const rand = seededRandom(name);
    const temperature = (36.3 + rand() * 0.9).toFixed(1);
    const spo2 = Math.round(97 + rand() * 2);
    const bpm = Math.round(60 + rand() * 25);
    const timestampType = columns.find((c) => c.column_name === timestampCol)?.data_type;
    const timestamp = formatTimestamp(new Date(Date.now() - idx * 60000), timestampType);

    const row = {};
    if (esiCol) row[esiCol] = 5;
    if (tempCol) row[tempCol] = Number(temperature);
    if (spo2Col) row[spo2Col] = spo2;
    if (bpmCol) row[bpmCol] = bpm;
    if (timestampCol) row[timestampCol] = timestamp;
    if (deviceCol) row[deviceCol] = "Raspberry Pi 5";
    if (userNameCol) row[userNameCol] = name;
    if (userIdCol) {
      const entry = userIds[idx] || userIds[idx % userIds.length];
      if (entry?.id) row[userIdCol] = entry.id;
    }
    return row;
  });

  if (format === "csv") {
    const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
    const csv = [
      cols.join(","),
      ...rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? "")).join(",")),
    ].join("\n");
    fs.writeFileSync(output, csv, "utf8");
  } else {
    fs.writeFileSync(output, JSON.stringify(rows, null, 2), "utf8");
  }

  console.log(`Generated ${rows.length} rows -> ${output}`);
  await client.end();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
