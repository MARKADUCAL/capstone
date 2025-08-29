import express from "express";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(__dirname, "../dist/autowash-hub/browser");

const app = express();

// Serve static files
app.use(
  express.static(browserDistFolder, {
    maxAge: "1y",
    index: false,
    redirect: false,
  })
);

// Try to use SSR handler if available, otherwise fallback to SPA
app.use("*", async (req, res, next) => {
  try {
    const { reqHandler } = await import(
      "../dist/autowash-hub/server/server.mjs"
    );
    return reqHandler(req, res, next);
  } catch (error) {
    // Fallback to SPA: serve index.html
    res.sendFile(resolve(browserDistFolder, "index.html"));
  }
});

export default app;
