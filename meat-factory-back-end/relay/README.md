# Print relay

The backend runs in the cloud; the 80mm printer (SPRT SP-POS891) sits on the
shop LAN. The cloud can't reach a `192.168.x.x` address, so this small process
runs on a machine **on the shop network**, polls the backend for queued print
jobs, and streams their bytes to the printer's raw port (9100).

```
cloud backend ──(claimNextPrintJob / ackPrintJob over HTTPS)──> relay ──(TCP 9100)──> printer
```

No dependencies — plain Node 18+.

## How it works

- `enqueuePrint(type, id)` on the backend renders a receipt to ESC/POS bytes and
  stores a `PrintJob` row (`status = PENDING`, bytes as base64).
- The relay loops every `POLL_MS`: `claimNextPrintJob` atomically flips the
  oldest pending job to `CLAIMED` and returns its bytes.
- The relay opens a TCP socket to `PRINTER_IP:9100`, writes the bytes, then
  calls `ackPrintJob(id, ok)`. Failure requeues the job (up to 3 attempts,
  then `FAILED`).
- A job stuck `CLAIMED` for >2 min (relay died mid-print) is picked back up
  automatically.

## Backend setup (one time)

Set on the cloud backend, then redeploy:

| var | value |
| --- | --- |
| `PRINT_RELAY_TOKEN` | a random secret (`node -e "console.log(crypto.randomUUID())"`) |
| `RECEIPT_HEADER` | company name for the receipt title (ASCII until the codepage is tuned — see below) |
| `ESCPOS_CODEPAGE` | leave unset for now (defaults to 6 = CP866) |

The `PrintJobs` table is created automatically on boot **if**
`POSTGRES_SYNC_ON_START=true`. If sync-on-start is off in production, create it
by hand once:

```sql
CREATE TABLE IF NOT EXISTS "PrintJobs" (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_key    varchar(255) NOT NULL,
  printer_ip     varchar(255),
  type           varchar(255) NOT NULL,
  ref_id         uuid,
  status         varchar(255) NOT NULL DEFAULT 'PENDING',
  payload_base64 text NOT NULL,
  attempts       integer NOT NULL DEFAULT 0,
  error          text,
  claimed_at     timestamptz,
  printed_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS print_jobs_status_created_at
  ON "PrintJobs" (status, created_at);
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS printers jsonb NOT NULL DEFAULT '[]';
```

## Multiple printers

Printers are managed in the app: **Settings → Принтер** (admin), one row per
printer with a name and its fixed IP. When a worker prints, the dialog asks
which printer; the job stores that printer's IP and **one relay** sends it
there. Adding a third printer = add a row in Settings. No relay change.

The relay machine must be able to reach every printer IP (same LAN). Printers
on separate networks would need a relay per network plus a filter — not
built yet.

## Printer setup (one time)

1. Ethernet cable from the printer to the router/switch.
2. Power off, hold **FEED**, power on — the self-test slip prints the IP.
3. Give it a **fixed** address (DHCP reservation in the router, or static via
   the SPRT utility). A receipt printer that changes IP breaks every day.
4. From the relay machine: `Test-NetConnection <printer-ip> -Port 9100` (or
   `nc -vz <printer-ip> 9100`) must succeed.
5. In the app: Settings → Принтер → add name + IP → Save → **Тест**.

## Running on the Samsung Galaxy Tab A9+ (Termux)

Android kills background apps aggressively, so the setup has required tweaks.

1. Install **Termux** and **Termux:Boot** from **F-Droid** (not the Play Store
   — that build is deprecated and broken).
2. In Termux:
   ```sh
   pkg update && pkg install nodejs
   mkdir -p ~/print-relay && cd ~/print-relay
   # copy relay.mjs here (scp, a shared folder, or paste via a text editor)
   cp .env.example .env && nano .env    # fill in URL + token
   node --env-file=.env relay.mjs       # test run — should print "relay up →"
   ```
3. Auto-start on boot — create `~/.termux/boot/print-relay.sh`:
   ```sh
   #!/data/data/com.termux/files/usr/bin/sh
   termux-wake-lock
   cd ~/print-relay
   exec node --env-file=.env relay.mjs
   ```
   `chmod +x ~/.termux/boot/print-relay.sh`
4. Android settings on the tablet:
   - Settings → Apps → Termux → Battery → **Unrestricted**.
   - Settings → Battery → Background usage limits → Termux **not** in "Sleeping
     apps" / "Deep sleeping apps".
   - Settings → Battery → turn off "Put unused apps to sleep" (or exclude Termux).
   - Keep the tablet **on the charger**.
   - Settings → Connections → Wi-Fi → Advanced → keep Wi-Fi on during sleep.
5. Reboot the tablet once and confirm the relay comes back (check the printer
   works, or `logcat`, or add a log file to the boot script).

When you outgrow the tablet, the same `relay.mjs` runs unchanged on a
Raspberry Pi / mini-PC — use `pm2` or a systemd unit instead of Termux:Boot.

## Finding the Mongolian codepage

CP866 (the default) covers Cyrillic but **not** Mongolian `Ө Ү` — those print as
`?`. To fix:

1. Call `enqueueCodepageSampler` (MANAGER+). It queues one slip that prints the
   `0x80–0xFF` glyph table under several `ESC t` slots.
2. On the slip, find the slot whose table shows `Ө ө Ү ү` in the right places.
3. Set `ESCPOS_CODEPAGE` to that number on the backend and redeploy.
4. If that slot places `Ө/Ү` at bytes CP866 doesn't map, tell the backend dev —
   the `CP866` map in `src/utils/escpos.ts` needs those two byte positions added
   (or swap in `iconv-lite`).
