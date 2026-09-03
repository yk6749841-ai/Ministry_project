import path from 'node:path'
import { fileURLToPath } from 'node:url'

// server/shared/paths.js -> dirname twice -> server/
export const SERVER_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

// Where generated return-home documents and the notifications CSV are written.
export const GENERATED_DIR = path.join(SERVER_ROOT, 'generated')
