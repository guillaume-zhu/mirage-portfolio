// Testimonial commun aux pages Project. Reprend fidèlement la mécanique du
// Pre-footer Home (src/animations.js) pour la révélation de la citation :
// split mot > lettre > span interne, rotate:-88→0 / xPercent:-20→0 /
// opacity:0→1, stagger 0.01, ease "back.out(1.1)". Contrairement au
// Pre-footer (sous-phase d'un pin partagé .clients-scene), Testimonial
// possède son propre pin local.
//
// Trois phases dans le même pin (jamais un second pin) :
// - Phase A (non pinnée, scrub) : la citation se révèle PENDANT que la
//   section entre naturellement dans le viewport, avant que son pin ne
//   s'enclenche. Se termine exactement au scroll où la Phase B démarre
//   (pinnedTl.scrollTrigger.start).
// - Phase B (pin à "top top") : attribution.
// - Phase C : cover Testimonial → Autres univers, même langage que les
//   autres transitions Mirage (Numbers→Manifesto, Manifesto→Footer) —
//   pin étendu + hold calculé pour ne pas ralentir l'attribution, clip-path
//   du panneau entrant, scale du contenu sortant.

export function initProjectTestimonial(gsap, ScrollTrigger) {
  const section = document.querySelector(".project-testimonial")
  if (!section) return

  const quote = section.querySelector(".project-testimonial-quote")
  const author = section.querySelector(".project-testimonial-author")
  if (!quote || !author) return

  // Split mot > lettre > span interne (identique à splitIntoLetters du
  // Pre-footer) : l'overflow:hidden sur .project-testimonial-letter masque
  // proprement la rotation d'entrée du span interne.
  const quoteText = quote.textContent.replace(/\s+/g, " ").trim()
  quote.innerHTML = ""
  const letters = []
  quoteText.split(" ").forEach((word) => {
    if (!word) return
    const wordSpan = document.createElement("span")
    wordSpan.className = "project-testimonial-word"
    word.split("").forEach((char) => {
      const letterSpan = document.createElement("span")
      letterSpan.className = "project-testimonial-letter"
      const innerSpan = document.createElement("span")
      innerSpan.textContent = char
      letterSpan.appendChild(innerSpan)
      wordSpan.appendChild(letterSpan)
      letters.push(innerSpan)
    })
    quote.appendChild(wordSpan)
    quote.appendChild(document.createTextNode(" "))
  })

  gsap.set(letters, { rotate: -88, xPercent: -20, opacity: 0 })
  gsap.set(author, { opacity: 0, y: 30 })

  const testimonialPinDistance = 0.35 // multiplicateur de window.innerHeight — Phase B (attribution)
  const otherUniversesCoverDistance = 1 // multiplicateur de window.innerHeight — Phase C (cover)

  // Phase B : pin, ne porte que l'attribution. Créée en premier pour servir
  // de source de vérité géométrique à la Phase A ci-dessous et à la Phase C.
  const pinnedTl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => "+=" + window.innerHeight * (testimonialPinDistance + otherUniversesCoverDistance),
      pin: true,
      pinSpacing: true, // réserve l'espace nécessaire pour que Autres Univers arrive normalement après la libération du pin
      scrub: 1,
    },
  })

  pinnedTl.to(author, {
    opacity: 1,
    y: 0,
    duration: 0.2,
    ease: "none",
  })

  // Hold calculé (jamais codé en dur) pour préserver exactement la vitesse
  // actuelle de la reveal de l'attribution : ancienne vitesse = A/S, nouvelle
  // = (A+hold)/(S+C) avec hold = A×(C/S) => identique quel que soit A/S/C.
  const attributionAnimationDuration = pinnedTl.duration()
  const coverHoldDuration = attributionAnimationDuration * (otherUniversesCoverDistance / testimonialPinDistance)
  pinnedTl.to({}, { duration: coverHoldDuration })

  // Phase A : reveal de la citation AVANT le pin, pendant que Gallery 2 est
  // encore visible et que Testimonial entre naturellement par le bas. Se
  // termine exactement quand la Phase B démarre (aucun trou, aucun
  // chevauchement) — mécanique/valeurs de la citation strictement inchangées.
  const preRevealTl = gsap.timeline({
    scrollTrigger: {
      trigger: quote,
      start: "top 80%",
      end: () => pinnedTl.scrollTrigger.start,
      scrub: 1,
    },
  })

  preRevealTl.to(letters, {
    rotate: 0,
    xPercent: 0,
    opacity: 1,
    duration: 0.4,
    stagger: 0.01,
    ease: "back.out(1.1)",
  })

  // Phase C : cover vers Autres Univers, même langage que les transitions
  // déjà validées ailleurs (Numbers→Manifesto, Manifesto→Footer).
  const coverStart = () => pinnedTl.scrollTrigger.start + window.innerHeight * testimonialPinDistance
  const coverPhasePx = () => window.innerHeight * otherUniversesCoverDistance
  const coverEnd = () => coverStart() + coverPhasePx()

  const otherUniversesEl = document.querySelector(".project-other-universes")
  const otherTitleEl = otherUniversesEl?.querySelector(".project-other-title")
  let insetXTween, radiusTween, testimonialScaleTween, otherTitleTween

  if (otherUniversesEl) {
    const otherClip = { insetX: 8, radius: 1.5 }
    function applyOtherClip() {
      gsap.set(otherUniversesEl, {
        clipPath:
          `inset(0 ${otherClip.insetX}vw 0 ${otherClip.insetX}vw ` +
          `round ${otherClip.radius}rem ${otherClip.radius}rem 0 0)`,
      })
    }
    applyOtherClip()

    insetXTween = gsap.to(otherClip, {
      insetX: 0,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: coverStart,
        end: () => coverStart() + 0.8 * coverPhasePx(),
        scrub: 1,
      },
      onUpdate: applyOtherClip,
    })

    radiusTween = gsap.to(otherClip, {
      radius: 0,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: () => coverStart() + 0.6 * coverPhasePx(),
        end: () => coverStart() + 0.8 * coverPhasePx(),
        scrub: 1,
      },
      onUpdate: applyOtherClip,
    })

    // Non interactif tant que le panneau n'est pas presque totalement
    // installé (progress > 0.9) — évite de pouvoir drag/cliquer Autres
    // Univers alors que Testimonial est encore largement visible derrière.
    // Réutilise ce même ScrollTrigger (il couvre exactement coverStart→coverEnd),
    // aucun trigger supplémentaire nécessaire.
    gsap.set(otherUniversesEl, { pointerEvents: "none" })

    // Reveal du titre, scrub-driven et donc réversible avec le reste du
    // cover : commence à mi-parcours de la phase, comme les autres reveals
    // de contenu déjà utilisés sur les transitions Mirage.
    if (otherTitleEl) {
      gsap.set(otherTitleEl, { opacity: 0, y: 30 })
      otherTitleTween = gsap.to(otherTitleEl, {
        opacity: 1,
        y: 0,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: () => coverStart() + 0.5 * coverPhasePx(),
          end: coverEnd,
          scrub: 1,
        },
      })
    }

    testimonialScaleTween = gsap.fromTo(
      ".project-testimonial-inner",
      { scale: 1 },
      {
        scale: 0.8,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: coverStart,
          end: coverEnd,
          scrub: 1,
          onUpdate: (self) => {
            gsap.set(otherUniversesEl, { pointerEvents: self.progress > 0.9 ? "auto" : "none" })
          },
        },
      },
    )
  }

  function destroy() {
    pinnedTl.scrollTrigger?.kill()
    pinnedTl.kill()
    preRevealTl.scrollTrigger?.kill()
    preRevealTl.kill()
    insetXTween?.scrollTrigger?.kill()
    insetXTween?.kill()
    radiusTween?.scrollTrigger?.kill()
    radiusTween?.kill()
    testimonialScaleTween?.scrollTrigger?.kill()
    testimonialScaleTween?.kill()
    otherTitleTween?.scrollTrigger?.kill()
    otherTitleTween?.kill()
  }

  return { destroy }
}
