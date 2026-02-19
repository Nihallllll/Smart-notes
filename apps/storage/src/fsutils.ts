import fs from "fs/promises"
import path from "path"
import crypto from "crypto"

export async function atomicWrite(filePath: string, content: string) {
  const dir = path.dirname(filePath)
  const base = path.basename(filePath)
  const tempPath = path.join(
    dir,
    base + ".tmp-" + Math.random().toString(36).slice(2)
  )

  await fs.writeFile(tempPath, content, "utf8")
  await fs.rename(tempPath, filePath)
}

export function computeHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex")
}

export function toPosix(p: string): string {
  return p.split(path.sep).join("/")
}

export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true })
}