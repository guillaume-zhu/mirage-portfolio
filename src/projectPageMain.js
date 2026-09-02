import './styles/project-page.css'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
import { initProjectHero } from './projectHero'

// Empêche le navigateur de restaurer l'ancienne position de scroll au reload
// (sinon la page peut se recharger au milieu du Hero, ScrollTrigger/Lenis
// n'étant pas encore prêts pour cette position). Exécuté avant même
// DOMContentLoaded pour intervenir le plus tôt possible.
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}
window.scrollTo(0, 0)

document.addEventListener('DOMContentLoaded', async () => {
  gsap.registerPlugin(ScrollTrigger)

  const lenisEasing = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
  const lenis = new Lenis({
    duration: 2.0,
    easing: lenisEasing,
    direction: 'vertical',
    smooth: true,
    touchMultiplier: 1.5,
  })

  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  // Attendu avant tout, comme sur About : la mesure de géométrie du Hero
  // (offsetTop/offsetHeight) doit se faire avec Gloock déjà chargé, sinon
  // les valeurs (headingHeight notamment) seraient fausses.
  await document.fonts.ready

  initProjectHero(gsap, ScrollTrigger)

  // Reveal Project Context : trop court pour justifier un module dédié
  // (aucune géométrie complexe, contrairement au Hero) — ScrollTrigger
  // déclenche une timeline normale (aucun scrub), jouée une seule fois.
  const contextLabel = document.querySelector(".project-context-label")
  const contextParagraphs = document.querySelectorAll(".project-context-copy p")
  if (contextLabel) {
    gsap.set([contextLabel, ...contextParagraphs], { opacity: 0, y: 30 })

    const contextRevealTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".project-context",
        start: "top 50%",
        toggleActions: "play none none none",
      },
    })

    contextRevealTl.to(contextLabel, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0)
    contextParagraphs.forEach((p, i) => {
      contextRevealTl.to(p, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.15 + i * 0.15)
    })
  }

  ScrollTrigger.refresh()
})
