import './styles/project-page.css'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
import { initProjectHero } from './projectHero'
import { initProjectTestimonial } from './projectTestimonial'

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

  // Reveal éditorial en cascade (label puis paragraphes), one-shot, sans
  // scrub — pattern partagé par toutes les sections texte des pages Project.
  function initEditorialReveal(sectionSelector, labelSelector, paragraphsSelector) {
    const section = document.querySelector(sectionSelector)
    if (!section) return
    const label = section.querySelector(labelSelector)
    if (!label) return
    const paragraphs = section.querySelectorAll(paragraphsSelector)

    gsap.set([label, ...paragraphs], { opacity: 0, y: 30 })

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: "top 50%", toggleActions: "play none none none" },
    })
    tl.to(label, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0)
    paragraphs.forEach((p, i) => {
      tl.to(p, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.15 + i * 0.15)
    })
  }

  initEditorialReveal(".project-context", ".project-context-label", ".project-context-copy p")
  initEditorialReveal(".project-direction", ".project-direction-label", ".project-direction-copy p")

  initProjectTestimonial(gsap, ScrollTrigger)

  ScrollTrigger.refresh()
})
