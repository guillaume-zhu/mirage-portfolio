// Section Approach : convoyeur de cards défilant horizontalement, repris
// aussi fidèlement que possible de /references/about/approach
// ("mwg_effect070") : startCol/endCol, duration, stagger, animationDistance,
// les sous-timelines par card insérées dans un master unique, power2.inOut
// et left:100% sont conservés à l'identique.
//
// Avec n=4 cards et COLS=4, la formule fait déjà correspondre l'état de
// repos (master à progress 0) à la grille Figma : card0→pos.card1 (49.5 vs
// 55px), card1→pos.card2 (609 vs 613px), card2→pos.card3 (1168.5 vs 1171px),
// card3→hors champ (1728 vs 1729px). Aucune position n'est donc codée en
// dur : tout vient de la formule d'origine.
//
// Seule adaptation structurelle : le pin est posé directement sur la section
// (comme sceneST/heroST ailleurs dans le site) au lieu du couple manuel
// pin-height + container de la référence — strictement équivalent en
// timing, sans le spacer manuel.

export function initAboutApproach(gsap, ScrollTrigger) {
  const root = document.querySelector(".about-approach")
  if (!root) return

  const cards = root.querySelectorAll(".about-approach-card")
  const n = cards.length

  const animationDistance = document.body.clientWidth + cards[0].clientWidth
  const COLS = window.innerWidth <= 768 ? 2 : 4
  const duration = 1 / n
  const stagger = window.innerWidth <= 768 ? 0.95 / n : 0.98 / n

  // Ratio dérivé de la référence : master ≈0.31 pour n=4 vs ≈0.649 pour n=9
  // (≈0.478), appliqué aux ~700vh de scroll effectif de la référence
  // (800vh de pin-height - 100vh de viewport) → ≈334vh.
  const approachScrollDistance = 3.34 // multiplicateur de window.innerHeight, à ajuster après test visuel

  const master = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: () => "+=" + window.innerHeight * approachScrollDistance,
      pin: true,
      scrub: true,
    },
  })

  cards.forEach((media, i) => {
    const startCol = Math.max(0, COLS - 1 - i)
    const endCol = Math.min(COLS, n - i)

    const tl = gsap.timeline({ defaults: { ease: "power2.inOut", duration } })

    if (startCol > 0) {
      tl.fromTo(
        media,
        { x: -(startCol / COLS) * animationDistance },
        { x: -((startCol + 1) / COLS) * animationDistance },
      )
    } else {
      tl.to(media, { x: -(1 / COLS) * animationDistance })
    }

    for (let col = startCol + 2; col <= endCol; col++) {
      tl.to(media, { x: -(col / COLS) * animationDistance })
    }

    master.add(tl, (i - (COLS - 1)) * stagger + startCol * duration)
  })

  function destroy() {
    master.scrollTrigger?.kill()
    master.kill()
  }

  return { destroy }
}
