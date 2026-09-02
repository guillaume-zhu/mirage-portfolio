import './styles/about.css'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
import { initAboutHero } from './aboutHero'
import { initAboutApproach } from './aboutApproach'
import { initAboutNumbers } from './aboutNumbers'
import { createAboutNumbersWebGL } from './aboutNumbersWebGL'
import { initAboutManifesto } from './aboutManifesto'
import { initAboutFooter } from './aboutFooter'
import { createFooterWebGL } from './footerWebGL'
import SplitText from 'gsap/SplitText'

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

  initAboutHero(gsap, ScrollTrigger)
  initAboutApproach(gsap, ScrollTrigger)
  initAboutNumbers(gsap, ScrollTrigger)

  const numbersEl = document.querySelector('.about-numbers')
  if (numbersEl) {
    createAboutNumbersWebGL(numbersEl)
  }

  // Aucune dépendance typographique : peut être initialisé avant l'attente des fonts.
  const footerEl = document.querySelector('#footer')
  if (footerEl) {
    createFooterWebGL(footerEl)
  }

  // SplitText doit mesurer les mots avec Gloock déjà chargé, sinon la
  // découpe en lignes se fait sur les métriques du fallback ("serif") et
  // reste figée après coup — seul Manifesto attend ce signal.
  await document.fonts.ready

  initAboutManifesto(gsap, ScrollTrigger, SplitText)

  // Le hold dépend de la géométrie finale de Manifesto : ses ScrollTriggers
  // internes doivent être créés sur sa géométrie naturelle avant qu'un pin
  // externe ne soit ajouté sur sa racine.
  initAboutFooter(gsap, ScrollTrigger)

  ScrollTrigger.refresh()
})
