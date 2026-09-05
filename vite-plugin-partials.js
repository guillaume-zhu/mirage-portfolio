// Plugin Vite maison : injecte les partials centralisés (src/partials/*.html)
// dans chaque page à la place de leur marqueur <!-- @include:xxx -->.
// S'exécute via transformIndexHtml, donc aussi bien en dev (à chaque requête)
// qu'au build (pour chaque entrée HTML) — zéro JS runtime, zéro flash, le
// HTML final est strictement identique à un partial codé en dur dans chaque
// page.
//
// Chaque fichier est relu à CHAQUE transformIndexHtml (donc à chaque requête
// en dev), plutôt que mis en cache une seule fois au démarrage du process
// Vite — sinon, éditer un partial pendant qu'un serveur dev tourne déjà sert
// indéfiniment l'ancien contenu (observé historiquement sur le Header : ancien
// chemin d'asset ./src/assets/img/logo-blanc.png, supprimé depuis, encore
// servi après un renommage vers public/assets/images/brand/logo-blanc.png).
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PARTIALS = [
  { marker: "<!-- @include:header -->", file: "src/partials/header.html" },
  { marker: "<!-- @include:footer -->", file: "src/partials/footer.html" },
]

export function partialsPlugin() {
  return {
    name: "mirage-partials",
    transformIndexHtml(html) {
      return PARTIALS.reduce((acc, { marker, file }) => {
        if (!acc.includes(marker)) return acc
        const content = readFileSync(path.join(__dirname, file), "utf-8").trim()
        return acc.replace(marker, content)
      }, html)
    },
  }
}
