// Transition Manifesto -> Footer About.
//
// Contrairement aux transitions précédentes (Hero->Approach, Approach->Numbers,
// Numbers->Manifesto), la section sortante (Manifesto) n'a jamais été pinnée :
// ses 3 séquences défilent en flux naturel. On ne pin donc QUE la toute fin de
// Manifesto (start:"bottom bottom"), une fois tout son contenu déjà défilé —
// jamais aboutManifesto.js lui-même, dont tous les ScrollTriggers internes
// (mots, couleurs) restent strictement inchangés et se terminent avant que ce
// hold ne s'active.
//
// Pendant ce hold d'1 viewport, Manifesto reste figée (pin) tandis que Footer,
// en flux normal avec margin-top:-100vh (about.css), remonte naturellement —
// même langage que les covers précédents, sans yPercent ni wrapper.

export function initAboutFooter(gsap, ScrollTrigger) {
  const footer = document.querySelector("#footer")
  const manifesto = document.querySelector(".about-manifesto")
  if (!footer || !manifesto) return

  const manifestoHoldST = ScrollTrigger.create({
    trigger: manifesto,
    start: "bottom bottom",
    end: "+=100%",
    pin: true,
    pinSpacing: true, // valeur par défaut, documentée explicitement : le cover (+100vh) et le margin-top:-100vh du footer dépendent de ce spacing
  })

  const coverStart = () => manifestoHoldST.start
  const coverEnd = () => manifestoHoldST.end
  const coverPhasePx = () => coverEnd() - coverStart()

  const footerClip = { insetX: 8, radius: 1.5 }
  function applyFooterClip() {
    gsap.set(footer, {
      clipPath:
        `inset(0 ${footerClip.insetX}vw 0 ${footerClip.insetX}vw ` +
        `round ${footerClip.radius}rem ${footerClip.radius}rem 0 0)`,
    })
  }
  applyFooterClip()

  const insetXTween = gsap.to(footerClip, {
    insetX: 0,
    ease: "none",
    scrollTrigger: { trigger: manifesto, start: coverStart, end: () => coverStart() + 0.8 * coverPhasePx(), scrub: 1 },
    onUpdate: applyFooterClip,
  })

  const radiusTween = gsap.to(footerClip, {
    radius: 0,
    ease: "none",
    scrollTrigger: {
      trigger: manifesto,
      start: () => coverStart() + 0.6 * coverPhasePx(),
      end: () => coverStart() + 0.8 * coverPhasePx(),
      scrub: 1,
    },
    onUpdate: applyFooterClip,
  })

  const manifestoScaleTween = gsap.fromTo(
    ".about-manifesto-sequence:last-child .about-manifesto-inner",
    { scale: 1 },
    { scale: 0.8, ease: "none", scrollTrigger: { trigger: manifesto, start: coverStart, end: coverEnd, scrub: 1 } },
  )

  const footerRevealTargets = [".footer-logo", ".footer-signature", ".footer-nav", ".footer-right"]
  gsap.set(footerRevealTargets, { opacity: 0, y: 40 })

  const footerContentTl = gsap.timeline({
    scrollTrigger: { trigger: manifesto, start: () => coverStart() + 0.5 * coverPhasePx(), end: coverEnd, scrub: 1 },
  })
  footerRevealTargets.forEach((selector, i) => {
    footerContentTl.to(selector, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, i * 0.25)
  })

  function destroy() {
    manifestoHoldST.kill()
    ;[insetXTween, radiusTween, manifestoScaleTween, footerContentTl].forEach((t) => {
      t?.scrollTrigger?.kill()
      t?.kill()
    })
  }

  return { destroy }
}
