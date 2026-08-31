window.addEventListener("DOMContentLoaded", () => {

    /* LENIS SMOOTH SCROLL (OPTIONAL) */
    lenis = new Lenis({
        autoRaf: true,
    })
    /* LENIS SMOOTH SCROLL (OPTIONAL) */

    const root = document.querySelector('.mwg_effect070');
    const pinHeight = root.querySelector('.pin-height')
    const container = root.querySelector('.container')
    const medias = root.querySelectorAll('.media')

    const animationDistance = document.body.clientWidth + medias[0].clientWidth

    const n = medias.length
    const COLS = window.innerWidth <= 768 ? 2 : 4
    const duration = 1 / n
    const stagger = window.innerWidth <= 768 ? 0.95 / n  : 0.92 / n 

    const master = gsap.timeline({
        scrollTrigger: {
            trigger: pinHeight,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            pin: container
        }
    });

    medias.forEach((media, i) => {
        const startCol = Math.max(0, COLS - 1 - i)
        const endCol = Math.min(COLS, n - i)

        let tl = gsap.timeline({
            defaults: { ease: "power2.inOut", duration }
        })

        if (startCol > 0) {
            tl.fromTo(media,
                { x: -(startCol / COLS) * animationDistance },
                { x: -((startCol + 1) / COLS) * animationDistance }
            )
        } else {
            tl.to(media, { x: -(1 / COLS) * animationDistance })
        }

        for (let col = startCol + 2; col <= endCol; col++) {
            tl.to(media, { x: -(col / COLS) * animationDistance })
        }

        master.add(tl, (i - (COLS - 1)) * stagger + startCol * duration)
    })
})