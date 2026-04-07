import fs from "fs";
import path from "path";

const logPath = path.join(process.cwd(), "dev-server.log");
const nextDevPath = path.join(process.cwd(), ".next", "dev");

try {
  fs.writeFileSync(logPath, "", "utf8");
  fs.rmSync(nextDevPath, { recursive: true, force: true });
} catch (error) {
  console.error("No se pudo limpiar el estado de desarrollo", error);
  process.exit(1);
}
