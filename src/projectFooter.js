// Transition Other Universes -> Footer, pages Project.
//
// Même langage strict que aboutFooter.js (lui-même dérivé du cover
// Pre-footer -> Footer de la Home : clip-path insetX 8vw->0, radius
// 1.5rem->0, scale sortant 1->0.8, reveal du contenu footer en cascade à
// 50% de la phase) — seules 2 adaptations, imposées par la nature de Other
// Universes (contrairement à Manifesto, jamais pinnée) :
//
// - Le pin ici porte sur .project-other-universes elle-même (nouvelle scène,
//   indépendante de celle Testimonial -> Other Universes déjà validée) et
//   démarre à "bottom bottom" : tant que ce seuil n'est pas atteint, la
//   section défile normalement, pleine hauteur, interaction intacte.
// - La cible du scale sortant n'est jamais .project-other-universes (c'est
//   le trigger du pin, GSAP gère déjà son transform) ni les cards
//   individuellement (moteur idle/drag intouché), mais .project-other-scene,
//   un wrapper dédié introduit dans le HTML — même séparation
//   container/content que .project-testimonial/.project-testimonial-inner.
//
// Aucune modification du moteur Other Universes (buffer 5 slots, FLIP
// aller/retour, quickTo, Observer) : cette transition traite la section
// comme un panneau sortant global.

export function initProjectFooter(gsap, ScrollTrigger) {
  const footer = document.querySelector("#footer")
  const otherUniverses = document.querySelector(".project-other-universes")
  const scene = otherUniverses?.querySelector(".project-other-scene")
  if (!footer || !otherUniverses || !scene) return

  // Hold avant le cover : même valeur que footerHoldPhasePx sur la Home
  // (0.35 × innerHeight), pour laisser le temps de voir Other Universes
  // plein écran avant que le Footer ne commence à la recouvrir.
  const footerHoldDistance = 0.35 // multiplicateur de window.innerHeight
  const otherUniversesCoverDistance = 1 // multiplicateur de window.innerHeight

  const coverHoldST = ScrollTrigger.create({
    trigger: otherUniverses,
    start: "bottom bottom",
    end: () => "+=" + window.innerHeight * (footerHoldDistance + otherUniversesCoverDistance),
    pin: true,
    pinSpacing: true,
  })

  const coverStart = () => coverHoldST.start + window.innerHeight * footerHoldDistance
  const coverPhasePx = () => window.innerHeight * otherUniversesCoverDistance
  const coverEnd = () => coverStart() + coverPhasePx()

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
    scrollTrigger: { trigger: otherUniverses, start: coverStart, end: () => coverStart() + 0.8 * coverPhasePx(), scrub: 1 },
    onUpdate: applyFooterClip,
  })

  const radiusTween = gsap.to(footerClip, {
    radius: 0,
    ease: "none",
    scrollTrigger: {
      trigger: otherUniverses,
      start: () => coverStart() + 0.6 * coverPhasePx(),
      end: () => coverStart() + 0.8 * coverPhasePx(),
      scrub: 1,
    },
    onUpdate: applyFooterClip,
  })

  // Interaction Other Universes coupée dès que le Footer commence
  // visiblement à la recouvrir (symétrique du seuil déjà utilisé côté
  // panneau entrant dans projectTestimonial.js, ici sur le panneau sortant).
  // Aucun gsap.set initial ici : avant coverStart, pointerEvents reste sous
  // l'autorité exclusive du cover Testimonial -> Other Universes déjà en
  // place (projectTestimonial.js), qui le remet à "auto" en fin de course.
  //
  // "is-scaling-out" : .project-other-container a son propre overflow:hidden
  // (moteur interne, intouché — il masque en permanence le buffer idle
  // ±2 au repos). Comme ce clip est À L'INTÉRIEUR de .project-other-scene,
  // il rétrécit avec elle pendant le scale sortant, alors que le clip externe
  // (.project-other-universes, jamais scalé) reste lui aligné sur le vrai
  // bord d'écran — les deux bords divergent et exposent un cut net des
  // cartes -1/+1 avec une marge visible autour. Le temps du scale, on relâche
  // ce clip interne (devenu redondant : à cet instant .project-other-scene
  // a exactement les mêmes bornes horizontales que .project-other-universes,
  // donc le clip externe suffit seul) pour ne garder que le bord d'écran,
  // qui lui rétrécit avec tout le reste sans jamais créer ce décalage.
  const sceneScaleTween = gsap.fromTo(
    scene,
    { scale: 1 },
    {
      scale: 0.8,
      ease: "none",
      scrollTrigger: {
        trigger: otherUniverses,
        start: coverStart,
        end: coverEnd,
        scrub: 1,
        onEnter: () => otherUniverses.classList.add("is-scaling-out"),
        onLeaveBack: () => otherUniverses.classList.remove("is-scaling-out"),
        onUpdate: (self) => {
          gsap.set(otherUniverses, { pointerEvents: self.progress < 0.1 ? "auto" : "none" })
        },
      },
    },
  )

  const footerRevealTargets = [".footer-logo", ".footer-signature", ".footer-nav", ".footer-right"]
  gsap.set(footerRevealTargets, { opacity: 0, y: 40 })

  const footerContentTl = gsap.timeline({
    scrollTrigger: { trigger: otherUniverses, start: () => coverStart() + 0.5 * coverPhasePx(), end: coverEnd, scrub: 1 },
  })
  footerRevealTargets.forEach((selector, i) => {
    footerContentTl.to(selector, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, i * 0.25)
  })

  function destroy() {
    coverHoldST.kill()
    ;[insetXTween, radiusTween, sceneScaleTween, footerContentTl].forEach((t) => {
      t?.scrollTrigger?.kill()
      t?.kill()
    })
    otherUniverses.classList.remove("is-scaling-out")
    gsap.set(otherUniverses, { pointerEvents: "auto" })
  }

  return { destroy }
}
