// Section Numbers : trois états (chiffre + légende) qui se succèdent via un
// flip 3D, repris aussi fidèlement que possible de /references/about/numbers
// ("mwg_effect053"). SplitText n'est pas nécessaire : nos deux "lignes" par
// état (chiffre, légende) sont écrites en dur dans le HTML plutôt que
// découpées à l'exécution, mais reçoivent exactement le même traitement
// (.line / .line-inner, rotationY, stagger, easing) que la référence.
//
// Seule simplification structurelle : un unique ScrollTrigger (pin+scrub)
// au lieu des deux triggers dupliqués (pin séparé + master) de la référence
// — même plomberie déjà utilisée pour aboutApproach.js.

export function initAboutNumbers(gsap, ScrollTrigger) {
  const root = document.querySelector(".about-numbers")
  if (!root) return

  const states = root.querySelectorAll(".about-numbers-state")
  const lines = Array.from(states).map((state) => state.querySelectorAll(".about-numbers-line"))

  lines.forEach((stateLines, i) => {
    if (i > 0) gsap.set(stateLines, { rotationY: 90 })
  })

  function getScrollScale() {
    if (window.innerWidth >= 1100) return 1
    if (window.innerWidth >= 768) return 0.8
    return 0.7
  }

  const numbersScrollDistance = 2.5 // multiplicateur de window.innerHeight, à ajuster après test visuel
  // Cover Numbers -> Manifesto : même langage que Approach -> Numbers.
  // Manifesto (en flux normal, margin-top:-100vh dans about.css) remonte
  // naturellement pendant que Numbers reste pinnée.
  const manifestoCoverDistance = 1 // multiplicateur de window.innerHeight, à ajuster après test visuel

  const master = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: () =>
        "+=" + window.innerHeight * (numbersScrollDistance + manifestoCoverDistance) * getScrollScale(),
      pin: true,
      scrub: true,
    },
  })

  lines.forEach((currentLines, i) => {
    const nextLines = lines[i + 1]
    if (!nextLines) return

    master.to(currentLines, { rotationY: -90, stagger: 0.07, duration: 1, ease: "back.inOut(1)" })
    master.to(nextLines, { rotationY: 0, stagger: 0.07, duration: 1, ease: "back.inOut(1)" }, "<")
  })

  // Hold calculé (jamais codé en dur) pour préserver exactement la vitesse
  // actuelle de l'animation Numbers : ancienne vitesse = A/S, nouvelle =
  // (A+hold)/(S+C) avec hold = A×(C/S) => identique quel que soit A/S/C.
  const numbersAnimationDuration = master.duration()
  const coverHoldDuration = numbersAnimationDuration * (manifestoCoverDistance / numbersScrollDistance)
  master.to({}, { duration: coverHoldDuration })

  const coverEnd = () =>
    master.scrollTrigger.start + window.innerHeight * numbersScrollDistance * getScrollScale()
  const manifestoCoverPhasePx = () => window.innerHeight * manifestoCoverDistance * getScrollScale()
  const manifestoCoverEnd = () => coverEnd() + manifestoCoverPhasePx()

  const manifestoEl = document.querySelector(".about-manifesto")
  let insetXTween, radiusTween, numbersScaleTween

  if (manifestoEl) {
    const coverScrollTrigger = { trigger: root, start: coverEnd, end: manifestoCoverEnd, scrub: 1 }

    const manifestoClip = { insetX: 8, radius: 1.5 }
    function applyManifestoClip() {
      gsap.set(manifestoEl, {
        clipPath:
          `inset(0 ${manifestoClip.insetX}vw 0 ${manifestoClip.insetX}vw ` +
          `round ${manifestoClip.radius}rem ${manifestoClip.radius}rem 0 0)`,
      })
    }
    applyManifestoClip()

    insetXTween = gsap.to(manifestoClip, {
      insetX: 0,
      ease: "none",
      scrollTrigger: {
        trigger: root,
        start: coverEnd,
        end: () => coverEnd() + 0.8 * manifestoCoverPhasePx(),
        scrub: 1,
      },
      onUpdate: applyManifestoClip,
    })

    radiusTween = gsap.to(manifestoClip, {
      radius: 0,
      ease: "none",
      scrollTrigger: {
        trigger: root,
        start: () => coverEnd() + 0.6 * manifestoCoverPhasePx(),
        end: () => coverEnd() + 0.8 * manifestoCoverPhasePx(),
        scrub: 1,
      },
      onUpdate: applyManifestoClip,
    })

    numbersScaleTween = gsap.fromTo(
      ".about-numbers-content",
      { scale: 1 },
      { scale: 0.8, ease: "none", scrollTrigger: coverScrollTrigger },
    )
  }

  function destroy() {
    master.scrollTrigger?.kill()
    master.kill()
    ;[insetXTween, radiusTween, numbersScaleTween].forEach((t) => {
      t?.scrollTrigger?.kill()
      t?.kill()
    })
  }

  return { destroy }
}
