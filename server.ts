import express from "express";
import path from "path";
import apiApp from "./api/index.js";

const app = express();
const PORT = 3000;

// Mount the API router
app.use(apiApp);

// Serve frontend
const distPath = path.join(process.cwd(), "dist");
if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Dev server
if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
  import("vite").then(({ createServer }) => {
    createServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then(vite => {
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Dev server running on http://localhost:${PORT}`);
      });
    });
  });
} else if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
