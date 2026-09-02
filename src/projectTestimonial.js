// Testimonial commun aux pages Project. Reprend fidèlement la mécanique du
// Pre-footer Home (src/animations.js) pour la révélation de la citation :
// split mot > lettre > span interne, rotate:-88→0 / xPercent:-20→0 /
// opacity:0→1, stagger 0.01, ease "back.out(1.1)". Contrairement au
// Pre-footer (sous-phase d'un pin partagé .clients-scene), Testimonial
// possède son propre pin local, dédié uniquement à l'attribution.
//
// Deux phases distinctes :
// - Phase A (non pinnée, scrub) : la citation se révèle PENDANT que la
//   section entre naturellement dans le viewport, avant que son pin ne
//   s'enclenche — pendant que Gallery 2 est encore visible. Se termine
//   exactement au scroll où la Phase B démarre (aucun trou, aucun
//   chevauchement), via une référence directe à pinnedTl.scrollTrigger.start
//   (même principe que coverEnd/numbersCoverEnd ailleurs dans ce codebase).
// - Phase B (pin à "top top") : ne porte plus que l'attribution, sur une
//   distance dédiée et courte (testimonialPinDistance), pour ne pas créer
//   un hold après la citation. La future transition vers "Autres univers"
//   pourra prolonger ce pin séparément, plus tard.

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

  const testimonialPinDistance = 0.35 // multiplicateur de window.innerHeight — premier test, ajustable (attribution seule, pas de hold)

  // Phase B : pin, ne porte plus que l'attribution. Créée en premier pour
  // servir de source de vérité géométrique à la Phase A ci-dessous.
  const pinnedTl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => "+=" + window.innerHeight * testimonialPinDistance,
      pin: true,
      pinSpacing: true, // réserve l'espace nécessaire pour que la future section Autres Univers arrive normalement après la libération du pin
      scrub: 1,
    },
  })

  pinnedTl.to(author, {
    opacity: 1,
    y: 0,
    duration: 0.2,
    ease: "none",
  })

  // Phase A : reveal de la citation AVANT le pin, pendant que Gallery 2 est
  // encore visible et que Testimonial entre naturellement par le bas. Se
  // termine exactement quand la Phase B démarre (aucun trou, aucun
  // chevauchement) — mécanique/valeurs de la citation strictement inchangées.
  const preRevealTl = gsap.timeline({
    scrollTrigger: {
      trigger: quote,
      start: "top 80%", // valeur de premier test : la citation doit devenir visible pendant que Gallery 2 est encore à l'écran
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

  function destroy() {
    pinnedTl.scrollTrigger?.kill()
    pinnedTl.kill()
    preRevealTl.scrollTrigger?.kill()
    preRevealTl.kill()
  }

  return { destroy }
}
