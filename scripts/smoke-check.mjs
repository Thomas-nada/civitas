import { spawn } from "node:child_process";

const host = "127.0.0.1";
const port = "18080";
const baseUrl = `http://${host}:${port}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(maxMs = 20000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < maxMs) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return true;
    } catch {
      // Keep polling until the server is ready.
    }
    await sleep(250);
  }
  return false;
}

async function run() {
  const env = {
    ...process.env,
    HOST: host,
    PORT: port,
    BLOCKFROST_API_KEY: process.env.BLOCKFROST_API_KEY || "smoke_dummy",
    SYNC_STARTUP_DELAY_MS: "600000"
  };

  const server = spawn(process.execPath, ["server.js"], {
    env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  let output = "";
  server.stdout.on("data", (chunk) => {
    output += String(chunk);
  });
  server.stderr.on("data", (chunk) => {
    output += String(chunk);
  });

  try {
    const healthy = await waitForHealth();
    if (!healthy) {
      throw new Error("Server failed health check within timeout.");
    }

    const healthRes = await fetch(`${baseUrl}/api/health`);
    const health = await healthRes.json();
    if (!healthRes.ok || health.ok !== true) {
      throw new Error("Health response was not OK.");
    }

    const syncRes = await fetch(`${baseUrl}/api/sync-status`);
    if (!syncRes.ok) {
      throw new Error("Sync status endpoint failed.");
    }
  } finally {
    server.kill("SIGTERM");
    await sleep(300);
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
