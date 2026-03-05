// download_models.js
import fs from "fs";
import path from "path";
import https from "https";

const baseDir = path.join(
  "C:",
  "Users",
  "riyac",
  "Downloads",
  "heart-song-forge-fixed",
  "heart-song-forge-main",
  "public",
  "models"
);

if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

const files = [
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1",
  "face_expression_model-weights_manifest.json",
  "face_expression_model-shard1",
];

const baseURL =
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/";

files.forEach((file) => {
  const url = baseURL + file;
  const dest = path.join(baseDir, file);

  console.log(`⬇️  Downloading ${url}`);
  https.get(url, (res) => {
    if (res.statusCode === 200) {
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on("finish", () => {
        fileStream.close();
        console.log(`✅ Saved ${file}`);
      });
    } else {
      console.error(`❌ Failed to download ${file}: ${res.statusCode}`);
    }
  });
});
