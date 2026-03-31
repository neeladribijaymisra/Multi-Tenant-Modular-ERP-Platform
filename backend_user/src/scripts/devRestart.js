import { exec } from "node:child_process";
import { spawn } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const port = process.env.PORT || "4000";

async function stopExistingPortProcess() {
  if (process.platform !== "win32") {
    return;
  }

  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => line.includes("LISTENING"));

    const pids = [...new Set(lines.map((line) => line.split(/\s+/).pop()).filter(Boolean))];

    for (const pid of pids) {
      await execAsync(`taskkill /PID ${pid} /F`);
      console.log(`Stopped existing process on port ${port} (PID ${pid}).`);
    }
  } catch {
    console.log(`Port ${port} is free. Starting backend_user dev server.`);
  }
}

async function start() {
  await stopExistingPortProcess();

  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const child = spawn(command, ["nodemon", "src/server.js"], {
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

start().catch((error) => {
  console.error("Failed to restart backend_user dev server", error);
  process.exit(1);
});
