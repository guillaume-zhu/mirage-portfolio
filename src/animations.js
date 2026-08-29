import gsap from "gsap"
import ScrollTrigger from "gsap/ScrollTrigger"
import Lenis from "@studio-freight/lenis"

export function initAnimations() {
  // --- CONFIGURATION ---
  gsap.registerPlugin(ScrollTrigger)

  // Init Lenis (Heavy Inertia)
  const lenisEasing = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
  const lenis = new Lenis({
    duration: 2.0, // Slower, more weight
    easing: lenisEasing,
    direction: "vertical",
    smooth: true,
    touchMultiplier: 1.5, // Less sensitive
  })

  // Sync Lenis <-> ScrollTrigger
  lenis.on("scroll", ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  // --- ANIMATIONS: HERO ---

  // Setup initial
  gsap.set(".hero-center-img", { xPercent: -50, yPercent: -50, scale: 1.1, filter: "blur(10px)" })
  gsap.set(".hero-center-container", { scale: 0, opacity: 0 })
  gsap.set(".hero-logo-container h1", { y: 100, opacity: 0, filter: "blur(20px)" })

  // Intro Timeline (Slow & Sequenced)
  const tlHero = gsap.timeline({ defaults: { ease: "power4.out" } })

  // 1. Background clears up slowly
  tlHero.fromTo(
    ".hero-bg-img",
    { scale: 1.2, filter: "blur(20px)" },
    { scale: 1, filter: "blur(0px)", duration: 3, ease: "power2.out" },
    0,
  )

  // 2. Blob appears (Organic expansion)
  tlHero.to(
    ".hero-center-container",
    { scale: 1, opacity: 1, duration: 2.5, ease: "elastic.out(0.8, 0.5)" },
    0.5,
  )
  tlHero.to(
    ".hero-center-img",
    { scale: 1, filter: "blur(0px)", duration: 2.5, ease: "power3.out" },
    0.5,
  )

  // 3. Logo floats in (Dreamy)
  tlHero.to(
    ".hero-logo-container h1",
    { y: 0, opacity: 1, filter: "blur(0px)", duration: 2, ease: "power3.out" },
    1.2,
  )

  // Parallaxe Scroll (Subtle)
  gsap.to(".hero-bg-img", {
    yPercent: 20,
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
  })
  gsap.to(".hero-center-container", {
    yPercent: 10,
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
  })
  gsap.to(".hero-logo-container", {
    yPercent: -30,
    opacity: 0,
    filter: "blur(10px)",
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "50% top", scrub: true },
  })

  // Hero Exit (Shrink & Round)
  gsap.to(".hero-bg-container", {
    scale: 0.96,
    borderRadius: "32px",
    ease: "power1.out",
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  })

  // --- ANIMATIONS: BLOB (Interactive) ---
  const blob = document.querySelector("#blob-container")
  const blobImage = document.querySelector(".hero-center-img")
  const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

  // Forme Sphérique Organique (30-70%) - Plus vive
  function getBlobShape() {
    const v = Array.from({ length: 8 }, () => random(50, 70)) // Stronger organic variation
    return `${v[0]}% ${v[1]}% ${v[2]}% ${v[3]}% / ${v[4]}% ${v[5]}% ${v[6]}% ${v[7]}%`
  }

  // Respiration (Lively)
  let blobTween = gsap.to(blob, {
    borderRadius: getBlobShape,
    duration: 2,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    repeatRefresh: true,
  })

  // Interaction Souris
  if (blob) {
    const blobTurbulence = document.querySelector("#liquid-distortion-blob feTurbulence")
    const blobDisplacement = document.querySelector("#liquid-distortion-blob feDisplacementMap")

    // Linked Elements
    // const logoDisplacement = document.querySelector("#liquid-distortion feDisplacementMap");
    // const logoTurbulence = document.querySelector("#liquid-distortion feTurbulence");

    blob.addEventListener("mouseenter", () => {
      gsap.to(blobTween, { timeScale: 2, duration: 1, ease: "power2.out" })
      gsap.to(blob, { opacity: 0, duration: 0.6, ease: "power2.out" })

      // Liquid Effect (Blob)
      if (blobDisplacement && blobTurbulence) {
        gsap.to(blobDisplacement, { attr: { scale: 30 }, duration: 0.8, ease: "power2.out" })
        gsap.to(blobTurbulence, {
          attr: { baseFrequency: 0.05 },
          duration: 0.8,
          ease: "power2.out",
        })
      }
    })

    blob.addEventListener("mouseleave", () => {
      gsap.to(blobTween, { timeScale: 1, duration: 1, ease: "power2.out" })
      gsap.to(blob, { opacity: 1, duration: 0.6, ease: "power2.out" })
      gsap.to(blob, { rotationX: 0, rotationY: 0, duration: 1.2, ease: "power2.out" })
      gsap.to(blobImage, { x: 0, y: 0, duration: 1.2, ease: "power2.out" })

      // Reset Liquid (Blob)
      if (blobDisplacement && blobTurbulence) {
        gsap.to(blobDisplacement, {
          attr: { scale: 0 },
          duration: 1.2,
          ease: "elastic.out(1, 0.5)",
        })
        gsap.to(blobTurbulence, {
          attr: { baseFrequency: 0.01 },
          duration: 1.2,
          ease: "power2.out",
        })
      }
    })
    blob.addEventListener("mousemove", (e) => {
      const rect = blob.getBoundingClientRect()
      const xPos = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      const yPos = ((e.clientY - rect.top) / rect.height - 0.5) * 2

      // Tilt Container (Fluid)
      gsap.to(blob, {
        rotationY: xPos * 5,
        rotationX: -yPos * 5,
        duration: 1.5,
        ease: "power2.out",
        overwrite: "auto",
      })
      // Lentille Liquide (Move image slightly)
      gsap.to(blobImage, {
        x: xPos * -20,
        y: yPos * -20,
        duration: 1,
        ease: "power2.out",
        overwrite: "auto",
      })
    })
  }

  // --- ANIMATIONS: CONCEPT (Scrollytelling Synchro) ---

  // 1. Préparation du Texte (Split par lettres, groupées par mot)
  const paragraph = document.getElementById("concept-text")
  let totalLetters = 0
  if (paragraph) {
    const textContent = paragraph.textContent.replace(/\s+/g, " ").trim()
    paragraph.innerHTML = ""

    const words = textContent.split(" ")
    words.forEach((word) => {
      if (!word) return
      const wordSpan = document.createElement("span")
      wordSpan.className = "word"
      word.split("").forEach((char) => {
        const letterSpan = document.createElement("span")
        letterSpan.textContent = char
        letterSpan.className = "letter"
        wordSpan.appendChild(letterSpan)
      })
      paragraph.appendChild(wordSpan)
      paragraph.appendChild(document.createTextNode(" ")) // Espace réel
    })
    totalLetters = document.querySelectorAll(".letter").length
  }

  // 2. Setup Images (Invisible + Bas)
  gsap.set(".image-card", { opacity: 0, y: 150, scale: 0.9 })

  // 3. Timeline Concept
  const conceptTl = gsap.timeline({
    scrollTrigger: {
      trigger: "#concept",
      start: "top top",
      end: "+=200%",
      pin: true,
      scrub: 1.5,
    },
  })

  // A. Texte (Lecture, lettre par lettre)
  const letterDuration = 0.05
  const letterStagger = totalLetters > 1 ? (2.9 - letterDuration) / (totalLetters - 1) : 0
  const letterGrayInDuration = 0.08
  const letterGrayInLead = 0.12
  const letterGrayColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--c-inactive")
    .trim()

  // A.1 Pré-apparition douce en gris, juste avant le passage du dégradé
  conceptTl.to(
    ".letter",
    {
      color: letterGrayColor,
      stagger: letterStagger,
      duration: letterGrayInDuration,
      ease: "sine.inOut",
    },
    -letterGrayInLead,
  )

  conceptTl.to(
    ".letter",
    {
      color: "rgba(0,0,0,0)", // Transparent to reveal background gradient
      stagger: letterStagger,
      duration: letterDuration, // Short duration for "harder" edge
      ease: "power1.out",
    },
    0,
  )

  // B. Images (Apparition Stack Verticale - Sequenced)
  // Cards float up with slight rotation reset, taille et dispersion légèrement aléatoires

  // Card 1: Centre
  conceptTl.to(
    ".card-1",
    {
      opacity: 1,
      y: 0,
      x: 0,
      scale: gsap.utils.random(0.88, 1.12),
      duration: 0.5,
      ease: "power3.out",
    },
    0,
  )

  // Card 2: Gauche Haut
  conceptTl.to(
    ".card-2",
    {
      opacity: 1,
      y: -40,
      x: -60,
      scale: gsap.utils.random(0.88, 1.12),
      duration: 0.5,
      ease: "power3.out",
    },
    0.6,
  )

  // Card 3: Droite Bas
  conceptTl.to(
    ".card-3",
    {
      opacity: 1,
      y: 60,
      x: 80,
      scale: gsap.utils.random(0.88, 1.12),
      duration: 0.5,
      ease: "power3.out",
    },
    1.2,
  )

  // Card 4: Gauche Bas
  conceptTl.to(
    ".card-4",
    {
      opacity: 1,
      y: 80,
      x: -40,
      scale: gsap.utils.random(0.88, 1.12),
      duration: 0.5,
      ease: "power3.out",
    },
    1.8,
  )

  // Card 5: Centre Haut (Final)
  conceptTl.to(
    ".card-5",
    {
      opacity: 1,
      y: -80,
      x: 20,
      scale: gsap.utils.random(0.88, 1.12),
      duration: 0.5,
      ease: "power3.out",
    },
    2.4,
  )

  // Hold phase (court temps de pause pour observer la composition finale)
  conceptTl.to({}, { duration: 0.3 })

  // --- ANIMATIONS: IMAGE CARDS LIQUID HOVER ---
  const svgNS = "http://www.w3.org/2000/svg"
  const liquidDefs = document.getElementById("liquid-defs")

  document.querySelectorAll(".image-card").forEach((card, index) => {
    const img = card.querySelector("img")
    if (!img || !liquidDefs) return

    // Filtre dédié à cette carte (déformation indépendante par image)
    const filterId = `liquid-distortion-card-${index}`
    const filter = document.createElementNS(svgNS, "filter")
    filter.setAttribute("id", filterId)

    const turbulenceCard = document.createElementNS(svgNS, "feTurbulence")
    turbulenceCard.setAttribute("type", "fractalNoise")
    turbulenceCard.setAttribute("baseFrequency", "0.008")
    turbulenceCard.setAttribute("numOctaves", "2")
    turbulenceCard.setAttribute("result", "warp")

    const displacementCard = document.createElementNS(svgNS, "feDisplacementMap")
    displacementCard.setAttribute("xChannelSelector", "R")
    displacementCard.setAttribute("yChannelSelector", "G")
    displacementCard.setAttribute("scale", "0")
    displacementCard.setAttribute("in", "SourceGraphic")
    displacementCard.setAttribute("in2", "warp")

    filter.appendChild(turbulenceCard)
    filter.appendChild(displacementCard)
    liquidDefs.appendChild(filter)

    img.style.filter = `url(#${filterId})`

    card.addEventListener("mouseenter", () => {
      gsap.to(displacementCard, { attr: { scale: 14 }, duration: 0.9, ease: "power2.out" })
      gsap.to(turbulenceCard, { attr: { baseFrequency: 0.022 }, duration: 0.9, ease: "power2.out" })
      gsap.to(img, { scale: 1.06, duration: 0.9, ease: "power2.out" })
    })

    card.addEventListener("mouseleave", () => {
      gsap.to(displacementCard, { attr: { scale: 0 }, duration: 1, ease: "power2.out" })
      gsap.to(turbulenceCard, { attr: { baseFrequency: 0.008 }, duration: 1, ease: "power2.out" })
      gsap.to(img, { scale: 1, duration: 1, ease: "power2.out" })
    })
  })

  // --- ANIMATIONS: EXPERTISE CARDS (Accordéon) ---
  const expertiseRoot = document.querySelector(".expertise-cards")
  if (expertiseRoot) {
    const expContainer = expertiseRoot.querySelector(".container")
    const expSlides = [...expContainer.querySelectorAll(".slide")]

    const expContents = expSlides.map((item) => item.querySelector(".content"))
    const expSmallTitles = expSlides.map((item) => item.querySelector(".small-title"))
    const expBottoms = expSlides.map((item) => item.querySelector(".bottom"))

    let expWidthOpen = Math.min(640, window.innerWidth * 0.58)
    const expWidthClosed = 88
    const expBorderRadiusClosed = 44
    const expBorderRadiusOpen = 20
    const expHeightClosed = 370
    const expHeightHover = 390
    const expHeightOpen = 460
    const expSmallTitleXOpen = 60
    const expContentXLeft = -720
    const expContentXRight = 70
    const expAxis = "x"

    expSlides[0].classList.add("on")

    gsap.set(expSlides[0], {
      flex: "0 0 " + expWidthOpen + "px",
      borderRadius: expBorderRadiusOpen,
    })
    gsap.set(expSlides.slice(1), {
      borderRadius: expBorderRadiusClosed,
      height: expHeightClosed,
    })
    gsap.set(expSmallTitles[0], {
      [expAxis]: expSmallTitleXOpen,
      autoAlpha: 0,
    })
    gsap.set(expSmallTitles.slice(1), {
      width: expHeightClosed,
    })
    gsap.set(expContents.slice(1), {
      [expAxis]: expContentXLeft,
    })
    gsap.set(expBottoms.slice(1), {
      autoAlpha: 0,
    })

    function expHandleMouseEnter(item, index) {
      if (item.classList.contains("on")) return

      gsap.to(item, {
        height: expHeightHover,
        duration: 0.3,
        ease: "back.out(2)",
      })
      gsap.to(expSmallTitles[index], {
        width: expHeightHover,
        duration: 0.3,
        ease: "back.out(2)",
      })
    }

    function expHandleMouseLeave(item, index) {
      if (item.classList.contains("on")) return

      gsap.to(item, {
        height: expHeightClosed,
        duration: 0.3,
        ease: "back.out(2)",
      })
      gsap.to(expSmallTitles[index], {
        width: expHeightClosed,
        duration: 0.3,
        ease: "back.out(2)",
      })
    }

    // Une transition = fermeture de fromIndex + ouverture de toIndex (toIndex > fromIndex,
    // donc toujours équivalent à la branche "isBefore: false" de l'ancien accordéon).
    // Le scrub de ScrollTrigger rejoue naturellement ce même segment à l'envers en cas de
    // retour en arrière, ce qui reproduit la logique directionnelle sans la dupliquer.
    function addExpertiseTransition(tl, fromIndex, toIndex, position) {
      tl.to(
        expSlides[fromIndex],
        {
          flex: "0 0 " + expWidthClosed + "px",
          height: expHeightClosed,
          borderRadius: expBorderRadiusClosed,
          duration: 0.5,
          ease: "back.inOut(0.9)",
        },
        position,
      )
      tl.to(
        expContents[fromIndex],
        {
          [expAxis]: expContentXLeft,
          duration: 0.5,
          ease: "back.inOut(0.9)",
        },
        position,
      )
      tl.to(
        expSmallTitles[fromIndex],
        {
          [expAxis]: 0,
          width: expHeightClosed,
          autoAlpha: 1,
          duration: 0.5,
          ease: "back.inOut(0.9)",
        },
        position,
      )
      tl.to(
        expBottoms[fromIndex],
        {
          autoAlpha: 0,
          duration: 0.4,
          ease: "power1.inOut",
        },
        position,
      )
      tl.to(
        expSlides[toIndex],
        {
          flex: "0 0 " + expWidthOpen + "px",
          borderRadius: expBorderRadiusOpen,
          height: expHeightOpen,
          duration: 0.5,
          ease: "back.inOut(0.9)",
        },
        position,
      )
      tl.fromTo(
        expContents[toIndex],
        { [expAxis]: expContentXLeft },
        { [expAxis]: 0, duration: 0.5, ease: "back.inOut(0.9)" },
        position,
      )
      tl.to(
        expSmallTitles[toIndex],
        {
          [expAxis]: expSmallTitleXOpen,
          width: expHeightOpen,
          autoAlpha: 0,
          duration: 0.5,
          ease: "back.inOut(0.9)",
        },
        position,
      )
      tl.to(
        expBottoms[toIndex],
        {
          autoAlpha: 1,
          duration: 0.4,
          ease: "power1.inOut",
        },
        position,
      )
    }

    const expTl = gsap.timeline({
      scrollTrigger: {
        trigger: "#expertise",
        start: "top top",
        end: "+=300%",
        pin: true,
        scrub: 1,
        snap: { snapTo: [0, 1 / 3, 2 / 3, 1], duration: 0.5, ease: "power1.inOut" },
        onUpdate: (self) => {
          const activeIndex = Math.round(self.progress * 3)
          expSlides.forEach((slide, i) => {
            slide.classList.toggle("on", i === activeIndex)
          })
        },
      },
    })

    addExpertiseTransition(expTl, 0, 1, 0)
    addExpertiseTransition(expTl, 1, 2, 1)
    addExpertiseTransition(expTl, 2, 3, 2)

    // Clic = déplacement Lenis vers la position de scroll correspondant à l'état visé ;
    // ScrollTrigger reste seul responsable de l'animation (source de vérité unique).
    function goToCardIndex(targetIndex) {
      const st = expTl.scrollTrigger
      if (!st) return

      const currentIndex = Math.round(st.progress * 3)
      if (targetIndex === currentIndex) return

      const targetY = st.start + (targetIndex / 3) * (st.end - st.start)
      lenis.scrollTo(targetY, { duration: 1.2, easing: lenisEasing })
    }

    expSlides.forEach((item, index) => {
      item.addEventListener("mouseenter", () => expHandleMouseEnter(item, index))
      item.addEventListener("mouseleave", () => expHandleMouseLeave(item, index))
      item.addEventListener("click", () => goToCardIndex(index))
    })
  }

  // --- ANIMATIONS: LOGO LIQUID HOVER ---
  const logoImg = document.querySelector(".hero-logo-img")
  const turbulence = document.querySelector("#liquid-distortion feTurbulence")
  const displacement = document.querySelector("#liquid-distortion feDisplacementMap")

  if (logoImg && displacement && turbulence) {
    // Idle subtle movement
    // gsap.to(turbulence, {
    //     attr: { baseFrequency: 0.02 },
    //     duration: 10,
    //     repeat: -1,
    //     yoyo: true,
    //     ease: "sine.inOut"
    // });

    // Mouse move interaction (optional, follows mouse slightly)
    logoImg.addEventListener("mouseenter", () => {
      gsap.to(displacement, {
        attr: { scale: 40 }, // Distortion intensity
        duration: 1,
        ease: "power2.out",
      })
      gsap.to(turbulence, {
        attr: { baseFrequency: 0.05 },
        duration: 1,
        ease: "power2.out",
      })
    })

    logoImg.addEventListener("mouseleave", () => {
      gsap.to(displacement, {
        attr: { scale: 0 }, // Back to normal
        duration: 1.2,
        ease: "elastic.out(1, 0.5)",
      })
      gsap.to(turbulence, {
        attr: { baseFrequency: 0.01 },
        duration: 1.2,
        ease: "power2.out",
      })
    })

    // Keep mousemove for subtle parallax if needed, or remove. keeping simple.
    logoImg.addEventListener("mousemove", (e) => {
      const rect = logoImg.getBoundingClientRect()
      const xPos = (e.clientX - rect.left) / rect.width
      const yPos = (e.clientY - rect.top) / rect.height

      // Subtle shift of frequency based on position
      gsap.to(turbulence, {
        attr: { baseFrequency: 0.02 + xPos * 0.01 },
        duration: 0.5,
        overwrite: "auto",
      })
    })
  }

  // --- ANIMATIONS: WORKS (Hover Reveal) ---
  const workItems = document.querySelectorAll(".project-item")
  const previewLeft = document.querySelector("#preview-left-img")
  const previewRight = document.querySelector("#preview-right-img")
  const previewLeftContainer = document.querySelector(".work-preview-left")
  const previewRightContainer = document.querySelector(".work-preview-right")

  if (workItems.length > 0) {
    // Get the SVG defs to append filters to
    const svgDefs = document.querySelector("svg defs")

    // Apparition en chaîne (opacité + distorsion liquide), pilotée par le scroll
    gsap.set(".works-label", { opacity: 0, y: 30 })
    gsap.set(workItems, { opacity: 0, pointerEvents: "none" })
    const workDisplacements = []
    const workTurbulences = []

    workItems.forEach((item, index) => {
      const title = item.querySelector(".project-title")

      // 1. Create unique filter for this item
      const filterId = `liquid-text-${index}`
      const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter")
      filter.id = filterId

      // Turbulence (état initial = distordu, comme en fin de hover-in)
      const turbulence = document.createElementNS("http://www.w3.org/2000/svg", "feTurbulence")
      turbulence.setAttribute("type", "fractalNoise")
      turbulence.setAttribute("baseFrequency", "0.005")
      turbulence.setAttribute("numOctaves", "3")
      turbulence.setAttribute("result", "warp")

      // Displacement (état initial = distordu, comme en fin de hover-in)
      const displacement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feDisplacementMap",
      )
      displacement.setAttribute("xChannelSelector", "R")
      displacement.setAttribute("yChannelSelector", "G")
      displacement.setAttribute("scale", "30")
      displacement.setAttribute("in", "SourceGraphic")
      displacement.setAttribute("in2", "warp")

      filter.appendChild(turbulence)
      filter.appendChild(displacement)
      if (svgDefs) svgDefs.appendChild(filter)

      // Apply filter to title
      if (title) title.style.filter = `url(#${filterId})`

      workDisplacements.push(displacement)
      workTurbulences.push(turbulence)

      item.addEventListener("mouseenter", () => {
        const imgLeft = item.querySelector(".project-img-left")?.getAttribute("src")
        const imgRight = item.querySelector(".project-img-right")?.getAttribute("src")

        if (previewLeft && imgLeft) previewLeft.src = imgLeft
        if (previewRight && imgRight) previewRight.src = imgRight

        // Animate In Images
        gsap.to([previewLeftContainer, previewRightContainer], {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto",
        })

        // Animate Text Distortion
        gsap.to(displacement, {
          attr: { scale: 30 },
          duration: 1,
          ease: "power2.out",
          overwrite: "auto",
        })
        gsap.to(turbulence, {
          attr: { baseFrequency: 0.005 },
          duration: 1,
          ease: "power2.out",
          overwrite: "auto",
        })
      })

      item.addEventListener("mouseleave", () => {
        // Animate Out Images
        gsap.to([previewLeftContainer, previewRightContainer], {
          opacity: 0,
          scale: 0.95,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto",
        })

        // Reset Text Distortion
        gsap.to(displacement, {
          attr: { scale: 0 },
          duration: 0.8,
          ease: "power2.out",
          overwrite: "auto",
        })
        gsap.to(turbulence, {
          attr: { baseFrequency: 0.02 },
          duration: 0.8,
          ease: "power2.out",
          overwrite: "auto",
        })
      })

      // Mouse move for subtle parallax on images?
      item.addEventListener("mousemove", (e) => {
        // Optional: Move images slightly based on cursor Y
        // const yPos = (e.clientY / window.innerHeight - 0.5) * 20;
        // gsap.to([previewLeftContainer, previewRightContainer], { y: `calc(-50% + ${yPos}px)`, duration: 0.5 });
      })
    })

    // Timeline pinnée : révélation en chaîne (opacité + fin de distorsion liquide)
    const worksTl = gsap.timeline({
      scrollTrigger: {
        trigger: "#works",
        start: "top top",
        end: "+=250%",
        pin: true,
        scrub: 1,
      },
    })

    worksTl.to(".works-label", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0)

    worksTl.to(
      workItems,
      { opacity: 1, pointerEvents: "auto", stagger: 0.5, duration: 0.6, ease: "power2.out" },
      0.5,
    )
    worksTl.to(
      workDisplacements,
      { attr: { scale: 0 }, stagger: 0.5, duration: 0.6, ease: "power2.out" },
      0.5,
    )
    worksTl.to(
      workTurbulences,
      { attr: { baseFrequency: 0.02 }, stagger: 0.5, duration: 0.6, ease: "power2.out" },
      0.5,
    )
    worksTl.to({}, { duration: 0.3 })
  }

  // --- ANIMATIONS: SCRATCH EFFECT ---
  workItems.forEach((item, index) => {
    const title = item.querySelector(".project-title")
    if (!title) return

    // 1. Create SVG Scratch
    const svgNS = "http://www.w3.org/2000/svg"
    const svg = document.createElementNS(svgNS, "svg")
    svg.setAttribute("class", "scratch-svg")
    // Position absolute over the text
    svg.style.position = "absolute"
    svg.style.top = "-20%"
    svg.style.left = "5%"
    svg.style.width = "70%"
    svg.style.height = "140%"
    svg.style.pointerEvents = "none"
    svg.style.zIndex = "10"
    svg.style.overflow = "visible"

    // Define Gradient
    const defs = document.createElementNS(svgNS, "defs")
    const gradient = document.createElementNS(svgNS, "linearGradient")
    const gradientId = `scratch-gradient-${index}`
    gradient.setAttribute("id", gradientId)
    gradient.setAttribute("x1", "0%")
    gradient.setAttribute("y1", "100%")
    gradient.setAttribute("x2", "100%")
    gradient.setAttribute("y2", "0%") // Approx 45 degrees

    // Stops alignés sur la palette (--c-red, --c-orange, --c-yellow, --c-rose)
    const stopsData = [
      { offset: "0%", color: "#A8131A" },
      { offset: "33%", color: "#C56C2C" },
      { offset: "66%", color: "#E9B523" },
      { offset: "100%", color: "#E7B3AD" },
    ]

    stopsData.forEach((s) => {
      const stop = document.createElementNS(svgNS, "stop")
      stop.setAttribute("offset", s.offset)
      stop.setAttribute("stop-color", s.color)
      gradient.appendChild(stop)
    })

    defs.appendChild(gradient)
    svg.appendChild(defs)

    // Generate random scratch path (curved/looped)
    const path = document.createElementNS(svgNS, "path")

    // Tighter viewbox for better control
    svg.setAttribute("viewBox", "0 0 200 60")
    svg.setAttribute("preserveAspectRatio", "none")

    // Generate points for a "looped" scribble
    // We'll use a series of Quadratic Bezier curves
    let d = "M0,30 "
    let x = 0
    let y = 30
    const width = 200
    const step = 50 // Much larger step for smoother, longer curves
    const amp = 20 // Reduced amplitude for subtler waves

    // Forward pass
    for (let i = 0; i <= width; i += step) {
      const nextX = i + step
      const nextY = 30 + (Math.random() - 0.5) * amp * 2

      if (i === 0) {
        // First curve needs explicit control point
        const cpX = (x + nextX) / 2
        const cpY = 30 - amp
        d += `Q${cpX},${cpY} ${nextX},${nextY} `
      } else {
        // Subsequent curves use T for smooth connection (auto-calculated control point)
        d += `T${nextX},${nextY} `
      }

      x = nextX
      y = nextY
    }

    // Backward pass (for density) - REMOVED for lighter look
    // A single pass is enough for a "light" scratch

    path.setAttribute("d", d)
    path.setAttribute("stroke", `url(#${gradientId})`) // Use the gradient
    path.setAttribute("stroke-width", "5.0") // Slightly thicker
    path.setAttribute("fill", "none")
    path.setAttribute("stroke-linecap", "round")
    path.setAttribute("stroke-linejoin", "round")

    svg.appendChild(path)
    title.appendChild(svg)

    // Prepare for draw animation
    const length = path.getTotalLength()

    path.style.strokeDasharray = length
    path.style.strokeDashoffset = length
    path.style.opacity = 0 // Start invisible

    // 2. Animate on Hover
    item.addEventListener("mouseenter", () => {
      gsap.to(path, {
        strokeDashoffset: 0,
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      })
    })

    item.addEventListener("mouseleave", () => {
      gsap.to(path, {
        strokeDashoffset: length,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        overwrite: "auto",
      })
    })
  })

  console.log("Mirage Studio: Refined Experience Loaded")
}
