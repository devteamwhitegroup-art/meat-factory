// Print relay — bridges the cloud backend and the LAN thermal printer.
//
// The backend runs in the cloud and can't reach a printer on the shop's
// private network. This process runs on a machine on that network (a tablet
// in Termux, a mini-PC, the shop laptop). It polls the backend for queued
// jobs and streams their ESC/POS bytes to the printer's raw port (9100).
//
//   node relay.mjs
//
// Config comes from the environment (see .env.example). No dependencies —
// plain Node 18+ (global fetch, node:net, Buffer).

import net from "node:net";

const MF_GRAPHQL_URL = must("MF_GRAPHQL_URL"); // https://api.example.com/graphql
const PRINT_RELAY_TOKEN = must("PRINT_RELAY_TOKEN"); // must match backend
// Printer IPs come from each job (admin sets name + IP in app Settings), so
// one relay serves every printer on this LAN.
// PRINTER_KEYS = comma-separated printer IDs (shown in Settings → Принтер) on
// THIS LAN. Required when factories are on separate networks, otherwise this
// relay would grab the other factory's jobs. Unset = claim every printer's jobs.
const PRINTER_KEYS = (process.env.PRINTER_KEYS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const PRINTER_PORT = Number(process.env.PRINTER_PORT || "9100");
const POLL_MS = Number(process.env.POLL_MS || "2000");
const CONNECT_TIMEOUT_MS = Number(process.env.CONNECT_TIMEOUT_MS || "10000");

function must(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

async function gql(query, variables) {
  const res = await fetch(MF_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-print-relay-token": PRINT_RELAY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

const CLAIM = `mutation Claim($printerKeys: [String!]) {
  claimNextPrintJob(printerKeys: $printerKeys) {
    success message printJob { id printerIp payloadBase64 }
  }
}`;
const ACK = `mutation Ack($id: ID!, $ok: Boolean!, $error: String) {
  ackPrintJob(id: $id, ok: $ok, error: $error) { success message }
}`;

// Open a raw TCP connection to the printer and stream the bytes. Resolves once
// the printer has accepted them and closed cleanly.
function sendToPrinter(ip, bytes) {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host: ip, port: PRINTER_PORT });
    let settled = false;
    const done = (err) => {
      if (settled) return;
      settled = true;
      sock.destroy();
      err ? reject(err) : resolve();
    };
    sock.setTimeout(CONNECT_TIMEOUT_MS);
    sock.on("connect", () => sock.end(bytes));
    sock.on("timeout", () => done(new Error("printer connection timed out")));
    sock.on("error", (e) => done(e));
    sock.on("close", (hadError) =>
      done(hadError ? new Error("printer socket closed with error") : null),
    );
  });
}

let lastEmpty = false;

async function tick() {
  const data = await gql(CLAIM, {
    printerKeys: PRINTER_KEYS.length ? PRINTER_KEYS : null,
  });
  const job = data.claimNextPrintJob?.printJob;
  if (!job) {
    if (!lastEmpty) console.log("queue empty, waiting…");
    lastEmpty = true;
    return;
  }
  lastEmpty = false;
  console.log(`job ${job.id}: printing → ${job.printerIp}`);
  try {
    await sendToPrinter(job.printerIp, Buffer.from(job.payloadBase64, "base64"));
    await gql(ACK, { id: job.id, ok: true, error: null });
    console.log(`job ${job.id}: ok`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await gql(ACK, { id: job.id, ok: false, error: msg }).catch(() => {});
    console.log(`job ${job.id}: FAILED — ${msg}`);
  }
}

// Self-scheduling loop: never overlaps, so a slow print can't cause a double
// claim even though there's only ever one relay.
// ponytail: one job at a time across all printers — an offline printer stalls
// the other for up to CONNECT_TIMEOUT_MS x 3 attempts, then its job FAILs.
// Per-printer workers if that ever hurts.
async function loop() {
  try {
    await tick();
  } catch (e) {
    console.error("tick error:", e instanceof Error ? e.message : e);
  }
  setTimeout(loop, POLL_MS);
}

console.log(
  `relay up → ${MF_GRAPHQL_URL}  printers ${PRINTER_KEYS.join(",") || "ALL"}  port ${PRINTER_PORT}  poll ${POLL_MS}ms`,
);
loop();
