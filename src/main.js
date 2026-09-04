import './styles/main.css';
import { initAnimations } from './animations';
import { createFooterWebGL } from './footerWebGL';

// Ancres qui existent bien dans le DOM, mais dont la position réelle ne
// correspond pas à la destination visuelle voulue car elles participent à
// des scènes ScrollTrigger pinnées/transformées (#expertise, #works,
// #footer) : neutraliser le saut natif du navigateur AVANT qu'il ne se
// produise sur le DOM brut, pas encore inflé par les pin-spacers. Mémorisé
// et rejoué manuellement une fois toutes les animations créées et la page
// réellement stable (cf. animations.js). Ne concerne QUE l'arrivée cross-page
// : le clic same-page (déjà sur la Home) continue de passer par Lenis direct.
const SUPPORTED_ANCHORS = ["#expertise", "#works", "#footer"]
const pendingHash = SUPPORTED_ANCHORS.includes(window.location.hash) ? window.location.hash : null
if (pendingHash) {
  history.scrollRestoration = 'manual'
  history.replaceState(null, '', window.location.pathname + window.location.search)
  window.scrollTo(0, 0)
}

document.addEventListener('DOMContentLoaded', () => {
    initAnimations(pendingHash);

    const footerEl = document.querySelector('#footer');
    if (footerEl) {
        createFooterWebGL(footerEl);
    }
});
