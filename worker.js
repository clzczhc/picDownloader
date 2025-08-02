import fs from "fs";
import { parentPort } from "worker_threads";

parentPort.on("message", async (data) => {
  const { imageData, filePath } = data;

  if (!fs.existsSync(filePath)) {
    const buffer = Buffer.from(imageData);
    fs.writeFile(filePath, buffer, () => {
      parentPort.postMessage("finish");
    });
  }
});
