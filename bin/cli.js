#!/usr/bin/env node

import { Command } from "commander";
import path from "path";
import { fileURLToPath } from "url";
import packageJson from "../package.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageDir = path.dirname(__dirname, "..");

const program = new Command();

program
  .name("downly")
  .description("Next.js application for downloading files")
  .version(packageJson.version);

// Start production server (standalone)
program
  .command("start")
  .description("Start the production server")
  .option("-v, --version", "version", "3000")
  .option("-p, --port <port>", "port to run app", "3000")
  .option("-h, --hostname <hostname>", "hostname to bind", "0.0.0.0")
  .option("-c, --config <path>", "path to config file")
  .option("-d, --download-path <path>", "path to download file location", "")
  .action(async (options) => {
    console.log("Starting Downly production server...");

    process.env.NODE_ENV = "production";
    process.env.NEXT_RUNTIME = "nodejs";

    process.env.PORT = options.port || config.port;
    process.env.HOSTNAME = options.hostname || config.hostname;
    process.env.DOWNLOAD_PATH = options.downloadPath || config.downloadPath;

    // Check if standalone server exists
    const standaloneServerPath = path.join(
      packageDir,
      "build",
      "standalone",
      "server.js",
    );

    try {
      // change to standalone directory
      process.chdir(path.join(packageDir, "build", "standalone"));

      // Import and run the standalone server
      await import(standaloneServerPath);
    } catch (error) {
      console.error("Error starting standalone server:", error.message);
      process.exit(1);
    }
  });

// Handle graceful shutdown for production
process.on("SIGTERM", () => {
  console.log("\n👋 Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n👋 Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

program.parse();
