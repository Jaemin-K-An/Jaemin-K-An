import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readme = readFileSync(resolve(root, "README.md"), "utf8");
const allowedColors = new Set(["#0D1116", "#2A00FF", "#FFFFFF"]);

const assetReferences = new Set(
  [...readme.matchAll(/\.\/assets\/([A-Za-z0-9._-]+)/g)].map(
    ([, filename]) => filename,
  ),
);

const missingAssets = [...assetReferences].filter(
  (filename) => !existsSync(resolve(root, "assets", filename)),
);

const svgFiles = readdirSync(resolve(root, "assets")).filter((filename) =>
  filename.endsWith(".svg"),
);

const invalidColors = svgFiles.flatMap((filename) => {
  const svg = readFileSync(resolve(root, "assets", filename), "utf8");
  const colors = new Set(svg.match(/#[0-9A-Fa-f]{6}/g) ?? []);

  return [...colors]
    .filter((color) => !allowedColors.has(color.toUpperCase()))
    .map((color) => `${filename}: ${color}`);
});

const remoteBase =
  "https://raw.githubusercontent.com/Jaemin-K-An/readme-boxes/main/dist/";
const remoteAssets = [
  "tech-stack",
  "project-audire",
  "project-concordia",
  "project-sensus",
  "timeline",
  "card-languages",
  "card-commit-time",
  "card-solved",
].flatMap((name) => [`${name}-light.svg`, `${name}-dark.svg`]);
const missingRemoteAssets = remoteAssets.filter(
  (filename) => !readme.includes(`${remoteBase}${filename}`),
);
const legacyLocalBoxes = [...assetReferences].filter(
  (filename) => filename.startsWith("card-") || filename.startsWith("timeline-"),
);

const failures = [
  ...missingAssets.map((filename) => `Missing README asset: ${filename}`),
  ...invalidColors.map((entry) => `Disallowed SVG color: ${entry}`),
  ...missingRemoteAssets.map((filename) => `Missing remote theme asset: ${filename}`),
  ...legacyLocalBoxes.map((filename) => `Legacy local box reference: ${filename}`),
];

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `README validation passed: ${assetReferences.size} local references, ${svgFiles.length} local SVG assets, ${remoteAssets.length} remote box assets.`,
  );
}
