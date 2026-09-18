const fs = require("fs");
const path = require("path");

const sourcePath = path.join(__dirname, "..", "build", "contracts", "Lottery.json");
const targetDir = path.join(__dirname, "..", "frontend", "src", "contracts");
const targetPath = path.join(targetDir, "Lottery.json");

if (!fs.existsSync(sourcePath)) {
  console.error("Error: build/contracts/Lottery.json not found. Run 'truffle compile' first.");
  process.exit(1);
}

try {
  const rawData = fs.readFileSync(sourcePath, "utf8");
  const artifact = JSON.parse(rawData);

  const exportedData = {
    contractName: artifact.contractName,
    abi: artifact.abi,
    networks: artifact.networks || {},
    updatedAt: new Date().toISOString()
  };

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(targetPath, JSON.stringify(exportedData, null, 2), "utf8");
  console.log(`[export-abi] Successfully exported Lottery ABI to ${targetPath}`);
} catch (err) {
  console.error("[export-abi] Failed to export ABI:", err);
  process.exit(1);
}
