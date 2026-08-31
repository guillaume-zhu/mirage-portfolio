window.addEventListener("DOMContentLoaded", () => {

    /* LENIS SMOOTH SCROLL (OPTIONAL) */
    lenis = new Lenis({
        autoRaf: true,
    })
    /* LENIS SMOOTH SCROLL (OPTIONAL) */

    gsap.to('.scroll', {
        autoAlpha: 0,
        duration: 0.2,
        scrollTrigger: {
            trigger: '.mwg_effect097',
            start: 'top top',
            end: 'top top-=1',
            toggleActions: "play none reverse none"
        }
    })

    const root = document.querySelector('.mwg_effect097')
    const container = root.querySelector('.container')
    const paragraphs = container.querySelectorAll('.content p')

    paragraphs.forEach((paragraph) => {
        SplitText.create(paragraph, {
            type: "lines, words",
            linesClass: 'line',
            wordsClass: 'word'
        })
    })

    const lines = root.querySelectorAll('.line')
    const containerWidth = container.clientWidth
    const containerRect = container.getBoundingClientRect()

    lines.forEach(line => {
        const words = Array.from(line.querySelectorAll('.word'))

        const totalWordsWidth = words.reduce((acc, word) => acc + word.getBoundingClientRect().width, 0)
        const gaps = words.length - 1
        const freeSpace = Math.max(containerWidth - totalWordsWidth, 0)
        const gapSize = gaps > 0 ? freeSpace / gaps : 0

        let targetLeft = 0

        words.forEach((word, index) => {
            const rect = word.getBoundingClientRect()
            const currentLeft = rect.left - containerRect.left
            const deltaX = targetLeft - currentLeft

            gsap.set(word, { x: deltaX })

            targetLeft += rect.width + (index < words.length - 1 ? gapSize : 0)
        })

        gsap.to(words, {
            x: 0,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: line,
                start: 'top bottom',
                end: 'top 60%',
                scrub: 0.2
            }
        })
    })
})