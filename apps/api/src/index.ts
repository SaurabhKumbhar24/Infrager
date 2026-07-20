import cors from "cors";
import express from "express";
import { config } from "./config";
import { migrate } from "./db";
import { authRouter } from "./routes/auth";
import { projectsRouter } from "./routes/projects";

const app = express();

app.use(
  cors({
    origin: config.corsOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "3mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);

// Uniform JSON error responses (Express 5 forwards async rejections here).
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

async function main() {
  await migrate();
  app.listen(config.port, () => {
    console.log(`Infrager API listening on :${config.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
