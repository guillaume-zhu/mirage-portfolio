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
  const approachScrollDistance = 1.5 // multiplicateur de window.innerHeight, à ajuster après test visuel
  // Cover Approach -> Numbers : même langage que Hero -> Approach. Numbers
  // (en flux normal, margin-top:-100vh dans about.css) remonte naturellement
  // pendant qu'Approach reste pinnée ; déclaré ici (avant la création du
  // ScrollTrigger) pour être disponible dès la première évaluation de `end`.
  const numbersCoverDistance = 1 // multiplicateur de window.innerHeight, à ajuster après test visuel

  const master = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: () => "+=" + window.innerHeight * (approachScrollDistance + numbersCoverDistance),
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

  // Hold calculé (jamais codé en dur) pour préserver exactement la vitesse
  // actuelle du convoyeur : ancienne vitesse = A/S, nouvelle = (A+hold)/(S+C)
  // avec hold = A×(C/S) => (A+hold)/(S+C) = A/S, identique quel que soit A/S/C.
  const approachAnimationDuration = master.duration()
  const coverHoldDuration = approachAnimationDuration * (numbersCoverDistance / approachScrollDistance)
  master.to({}, { duration: coverHoldDuration })

  const coverEnd = () => master.scrollTrigger.start + window.innerHeight * approachScrollDistance
  const numbersCoverPhasePx = () => window.innerHeight * numbersCoverDistance
  const numbersCoverEnd = () => coverEnd() + numbersCoverPhasePx()

  const numbersEl = document.querySelector(".about-numbers")
  let insetXTween, radiusTween, approachScaleTween, numbersRevealTl

  if (numbersEl) {
    const coverScrollTrigger = { trigger: root, start: coverEnd, end: numbersCoverEnd, scrub: 1 }

    const numbersClip = { insetX: 8, radius: 1.5 }
    function applyNumbersClip() {
      gsap.set(numbersEl, {
        clipPath:
          `inset(0 ${numbersClip.insetX}vw 0 ${numbersClip.insetX}vw ` +
          `round ${numbersClip.radius}rem ${numbersClip.radius}rem 0 0)`,
      })
    }
    applyNumbersClip()

    insetXTween = gsap.to(numbersClip, {
      insetX: 0,
      ease: "none",
      scrollTrigger: {
        trigger: root,
        start: coverEnd,
        end: () => coverEnd() + 0.8 * numbersCoverPhasePx(),
        scrub: 1,
      },
      onUpdate: applyNumbersClip,
    })

    radiusTween = gsap.to(numbersClip, {
      radius: 0,
      ease: "none",
      scrollTrigger: {
        trigger: root,
        start: () => coverEnd() + 0.6 * numbersCoverPhasePx(),
        end: () => coverEnd() + 0.8 * numbersCoverPhasePx(),
        scrub: 1,
      },
      onUpdate: applyNumbersClip,
    })

    approachScaleTween = gsap.fromTo(
      [".about-approach-intro", ".about-approach-row"],
      { scale: 1 },
      { scale: 0.8, ease: "none", scrollTrigger: coverScrollTrigger },
    )

    // Reveal en cascade du contenu Numbers (opacité + translateY), déclenché
    // quand le panneau a recouvert 50% de l'écran — même traitement que la
    // cascade Approach (aboutHero.js). Seul le premier état (visible dès le
    // départ, avant tout flip) a besoin de ce reveal : les états suivants
    // démarrent déjà cachés par rotationY:90 côté aboutNumbers.js.
    const firstValue = numbersEl.querySelector(".about-numbers-state:first-child .about-numbers-value")
    const firstCaption = numbersEl.querySelector(".about-numbers-state:first-child .about-numbers-caption")
    const numbersLabel = numbersEl.querySelector(".about-numbers-label")

    gsap.set([numbersLabel, firstValue, firstCaption], { opacity: 0, y: 40 })

    numbersRevealTl = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: () => coverEnd() + 0.5 * numbersCoverPhasePx(),
        end: numbersCoverEnd,
        scrub: 1,
      },
    })

    numbersRevealTl.to(numbersLabel, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0)
    numbersRevealTl.to(firstValue, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.25)
    numbersRevealTl.to(firstCaption, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.5)
  }

  function destroy() {
    master.scrollTrigger?.kill()
    master.kill()
    ;[insetXTween, radiusTween, approachScaleTween, numbersRevealTl].forEach((t) => {
      t?.scrollTrigger?.kill()
      t?.kill()
    })
  }

  return { destroy }
}
