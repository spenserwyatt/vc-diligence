import path from "path";

// web/ is a subdirectory of the project root
export const PROJECT_ROOT = path.resolve(process.cwd(), "..");
export const DEALS_DIR = path.join(PROJECT_ROOT, "deals");
export const OUTPUT_DIR = path.join(PROJECT_ROOT, "output");
export const SCRIPTS_DIR = path.join(PROJECT_ROOT, "scripts");
