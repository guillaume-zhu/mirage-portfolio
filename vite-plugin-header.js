// Plugin Vite maison : injecte le header, centralisé dans
// src/partials/header.html, dans chaque page à la place du marqueur
// <!-- @include:header -->. S'exécute via transformIndexHtml, donc aussi
// bien en dev (à chaque requête) qu'au build (pour chaque entrée HTML) —
// zéro JS runtime, zéro flash, le HTML final est strictement identique à
// un header codé en dur dans chaque page.
//
// Le fichier est relu à CHAQUE transformIndexHtml (donc à chaque requête en
// dev), plutôt que mis en cache une seule fois au démarrage du process Vite —
// sinon, éditer header.html pendant qu'un serveur dev tourne déjà sert
// indéfiniment l'ancien contenu (observé : ancien chemin d'asset
// ./src/assets/img/logo-blanc.png, supprimé depuis, encore servi après un
// renommage vers public/assets/images/brand/logo-blanc.png).
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const headerPath = path.join(__dirname, "src/partials/header.html")

export function headerPlugin() {
  return {
    name: "mirage-header-partial",
    transformIndexHtml(html) {
      const headerPartial = readFileSync(headerPath, "utf-8").trim()
      return html.replace("<!-- @include:header -->", headerPartial)
    },
  }
}
