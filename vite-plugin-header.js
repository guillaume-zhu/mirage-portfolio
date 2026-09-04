// Plugin Vite maison : injecte le header, centralisé dans
// src/partials/header.html, dans chaque page à la place du marqueur
// <!-- @include:header -->. S'exécute via transformIndexHtml, donc aussi
// bien en dev (à chaque requête) qu'au build (pour chaque entrée HTML) —
// zéro JS runtime, zéro flash, le HTML final est strictement identique à
// un header codé en dur dans chaque page.
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const headerPartial = readFileSync(
  path.join(__dirname, "src/partials/header.html"),
  "utf-8",
).trim()

export function headerPlugin() {
  return {
    name: "mirage-header-partial",
    transformIndexHtml(html) {
      return html.replace("<!-- @include:header -->", headerPartial)
    },
  }
}
