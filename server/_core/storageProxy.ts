import type { Express } from "express";
import path from "path";
import { getUploadsDir } from "../storage";

export function registerStorageProxy(app: Express) {
  const uploadsDir = getUploadsDir();
  app.get("/manus-storage/*", (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    const filePath = path.join(uploadsDir, key);
    if (!filePath.startsWith(uploadsDir)) {
      res.status(400).send("Invalid storage key");
      return;
    }

    res.set("Cache-Control", "no-store");
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).send("File not found");
      }
    });
  });
}
