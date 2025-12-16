import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

export function initAnimations() {
    // --- CONFIGURATION ---
    gsap.registerPlugin(ScrollTrigger);

    // Init Lenis (Heavy Inertia)
    const lenis = new Lenis({
        duration: 2.0, // Slower, more weight
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        smooth: true,
        touchMultiplier: 1.5, // Less sensitive
    });

    // Sync Lenis <-> ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);


    // --- ANIMATIONS: HERO ---

    // Setup initial
    gsap.set(".hero-center-img", { xPercent: -50, yPercent: -50, scale: 1.1, filter: "blur(10px)" });
    gsap.set(".hero-center-container", { scale: 0, opacity: 0 });
    gsap.set(".hero-logo-container h1", { y: 100, opacity: 0, filter: "blur(20px)" });

    // Intro Timeline (Slow & Sequenced)
    const tlHero = gsap.timeline({ defaults: { ease: "power4.out" } });

    // 1. Background clears up slowly
    tlHero.fromTo(".hero-bg-img",
        { scale: 1.2, filter: "blur(20px)" },
        { scale: 1, filter: "blur(0px)", duration: 3, ease: "power2.out" },
        0
    );

    // 2. Blob appears (Organic expansion)
    tlHero.to(".hero-center-container",
        { scale: 1, opacity: 1, duration: 2.5, ease: "elastic.out(0.8, 0.5)" },
        0.5
    );
    tlHero.to(".hero-center-img",
        { scale: 1, filter: "blur(0px)", duration: 2.5, ease: "power3.out" },
        0.5
    );

    // 3. Logo floats in (Dreamy)
    tlHero.to(".hero-logo-container h1",
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 2, ease: "power3.out" },
        1.2
    );

    // Parallaxe Scroll (Subtle)
    gsap.to(".hero-bg-img", { yPercent: 20, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero-center-container", { yPercent: 10, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero-logo-container", { yPercent: -30, opacity: 0, filter: "blur(10px)", ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "50% top", scrub: true } });

    // Hero Exit (Shrink & Round)
    gsap.to(".hero-bg-container", {
        scale: 0.96,
        borderRadius: "32px",
        ease: "power1.out",
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });


    // --- ANIMATIONS: BLOB (Interactive) ---
    const blob = document.querySelector("#blob-container");
    const blobImage = document.querySelector(".hero-center-img");
    const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

    // Forme Sphérique Organique (30-70%) - Plus vive
    function getBlobShape() {
        const v = Array.from({ length: 8 }, () => random(50, 70)); // Stronger organic variation
        return `${v[0]}% ${v[1]}% ${v[2]}% ${v[3]}% / ${v[4]}% ${v[5]}% ${v[6]}% ${v[7]}%`;
    }

    // Respiration (Lively)
    let blobTween = gsap.to(blob, { borderRadius: getBlobShape, duration: 2, ease: "sine.inOut", repeat: -1, yoyo: true, repeatRefresh: true });

    // Interaction Souris
    if (blob) {
        const blobTurbulence = document.querySelector("#liquid-distortion-blob feTurbulence");
        const blobDisplacement = document.querySelector("#liquid-distortion-blob feDisplacementMap");

        // Linked Elements
        // const logoDisplacement = document.querySelector("#liquid-distortion feDisplacementMap");
        // const logoTurbulence = document.querySelector("#liquid-distortion feTurbulence");

        blob.addEventListener("mouseenter", () => {
            gsap.to(blobTween, { timeScale: 2, duration: 1, ease: "power2.out" });

            // Liquid Effect (Blob)
            if (blobDisplacement && blobTurbulence) {
                gsap.to(blobDisplacement, { attr: { scale: 30 }, duration: 0.8, ease: "power2.out" });
                gsap.to(blobTurbulence, { attr: { baseFrequency: 0.05 }, duration: 0.8, ease: "power2.out" });
            }
        });

        blob.addEventListener("mouseleave", () => {
            gsap.to(blobTween, { timeScale: 1, duration: 1, ease: "power2.out" });
            gsap.to(blob, { rotationX: 0, rotationY: 0, duration: 1.2, ease: "power2.out" });
            gsap.to(blobImage, { x: 0, y: 0, duration: 1.2, ease: "power2.out" });

            // Reset Liquid (Blob)
            if (blobDisplacement && blobTurbulence) {
                gsap.to(blobDisplacement, { attr: { scale: 0 }, duration: 1.2, ease: "elastic.out(1, 0.5)" });
                gsap.to(blobTurbulence, { attr: { baseFrequency: 0.01 }, duration: 1.2, ease: "power2.out" });
            }
        });
        blob.addEventListener("mousemove", (e) => {
            const rect = blob.getBoundingClientRect();
            const xPos = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const yPos = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

            // Tilt Container (Fluid)
            gsap.to(blob, { rotationY: xPos * 5, rotationX: -yPos * 5, duration: 1.5, ease: "power2.out", overwrite: "auto" });
            // Lentille Liquide (Move image slightly)
            gsap.to(blobImage, { x: xPos * -20, y: yPos * -20, duration: 1, ease: "power2.out", overwrite: "auto" });
        });
    }


    // --- ANIMATIONS: CONCEPT (Scrollytelling Synchro) ---

    // 1. Préparation du Texte (Clean Split)
    const paragraph = document.getElementById('concept-text');
    if (paragraph) {
        const textContent = paragraph.textContent.replace(/\s+/g, ' ').trim();
        paragraph.innerHTML = '';

        const words = textContent.split(' ');
        words.forEach(word => {
            if (!word) return;
            const span = document.createElement('span');
            span.textContent = word;
            span.className = 'word';
            paragraph.appendChild(span);
            paragraph.appendChild(document.createTextNode(' ')); // Espace réel
        });
    }

    // 2. Setup Images (Invisible + Bas)
    gsap.set(".image-card", { opacity: 0, y: 150, scale: 0.9 });

    // 3. Timeline Concept
    const conceptTl = gsap.timeline({
        scrollTrigger: {
            trigger: "#concept",
            start: "top top",
            end: "+=400%", // Increased scroll distance for more time
            pin: true,
            scrub: 1.5,
        }
    });

    // A. Texte (Lecture)
    conceptTl.to(".word", {
        color: "rgba(0,0,0,0)", // Transparent to reveal background gradient
        stagger: 0.12,
        duration: 0.1,   // Short duration for "harder" edge
        ease: "power1.out"
    }, 0);

    // B. Images (Apparition Stack Verticale - Sequenced)
    // Cards float up with slight rotation reset

    // Card 1: Centre
    conceptTl.to(".card-1", { opacity: 1, y: 0, x: 0, scale: 1, duration: 0.5, ease: "power3.out" }, 0);

    // Card 2: Gauche Haut
    conceptTl.to(".card-2", { opacity: 1, y: -20, x: -30, scale: 1, duration: 0.5, ease: "power3.out" }, 0.6);

    // Card 3: Droite Bas
    conceptTl.to(".card-3", { opacity: 1, y: 30, x: 40, scale: 1, duration: 0.5, ease: "power3.out" }, 1.2);

    // Card 4: Gauche Bas
    conceptTl.to(".card-4", { opacity: 1, y: 40, x: -20, scale: 1, duration: 0.5, ease: "power3.out" }, 1.8);

    // Card 5: Centre Haut (Final)
    conceptTl.to(".card-5", { opacity: 1, y: -40, x: 10, scale: 1, duration: 0.5, ease: "power3.out" }, 2.4);

    // Hold phase (Wait for a bit before unpinning)
    // conceptTl.to({}, { duration: 1.0 });

    // --- ANIMATIONS: LOGO LIQUID HOVER ---
    const logoImg = document.querySelector(".hero-logo-img");
    const turbulence = document.querySelector("#liquid-distortion feTurbulence");
    const displacement = document.querySelector("#liquid-distortion feDisplacementMap");

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
                ease: "power2.out"
            });
            gsap.to(turbulence, {
                attr: { baseFrequency: 0.05 },
                duration: 1,
                ease: "power2.out"
            });
        });

        logoImg.addEventListener("mouseleave", () => {
            gsap.to(displacement, {
                attr: { scale: 0 }, // Back to normal
                duration: 1.2,
                ease: "elastic.out(1, 0.5)"
            });
            gsap.to(turbulence, {
                attr: { baseFrequency: 0.01 },
                duration: 1.2,
                ease: "power2.out"
            });
        });

        // Keep mousemove for subtle parallax if needed, or remove. keeping simple.
        logoImg.addEventListener("mousemove", (e) => {
            const rect = logoImg.getBoundingClientRect();
            const xPos = (e.clientX - rect.left) / rect.width;
            const yPos = (e.clientY - rect.top) / rect.height;

            // Subtle shift of frequency based on position
            gsap.to(turbulence, {
                attr: { baseFrequency: 0.02 + (xPos * 0.01) },
                duration: 0.5,
                overwrite: "auto"
            });
        });
    }

    // --- ANIMATIONS: WORKS (Hover Reveal) ---
    const workItems = document.querySelectorAll(".project-item");
    const previewLeft = document.querySelector("#preview-left-img");
    const previewRight = document.querySelector("#preview-right-img");
    const previewLeftContainer = document.querySelector(".work-preview-left");
    const previewRightContainer = document.querySelector(".work-preview-right");

    if (workItems.length > 0) {
        // List appearance
        // List appearance
        gsap.fromTo(".project-item",
            { y: 50, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                stagger: 0.1,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: "#works",
                    start: "top 90%", // Trigger earlier
                }
            }
        );

        // Get the SVG defs to append filters to
        const svgDefs = document.querySelector("svg defs");

        workItems.forEach((item, index) => {
            const title = item.querySelector(".project-title");

            // 1. Create unique filter for this item
            const filterId = `liquid-text-${index}`;
            const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
            filter.id = filterId;

            // Turbulence
            const turbulence = document.createElementNS("http://www.w3.org/2000/svg", "feTurbulence");
            turbulence.setAttribute("type", "fractalNoise");
            turbulence.setAttribute("baseFrequency", "0.02");
            turbulence.setAttribute("numOctaves", "3");
            turbulence.setAttribute("result", "warp");

            // Displacement
            const displacement = document.createElementNS("http://www.w3.org/2000/svg", "feDisplacementMap");
            displacement.setAttribute("xChannelSelector", "R");
            displacement.setAttribute("yChannelSelector", "G");
            displacement.setAttribute("scale", "0");
            displacement.setAttribute("in", "SourceGraphic");
            displacement.setAttribute("in2", "warp");

            filter.appendChild(turbulence);
            filter.appendChild(displacement);
            if (svgDefs) svgDefs.appendChild(filter);

            // Apply filter to title
            if (title) title.style.filter = `url(#${filterId})`;

            item.addEventListener("mouseenter", () => {
                const imgLeft = item.getAttribute("data-img-left");
                const imgRight = item.getAttribute("data-img-right");

                if (previewLeft && imgLeft) previewLeft.src = imgLeft;
                if (previewRight && imgRight) previewRight.src = imgRight;

                // Animate In Images
                gsap.to([previewLeftContainer, previewRightContainer], {
                    opacity: 1,
                    scale: 1,
                    duration: 0.5,
                    ease: "power2.out",
                    overwrite: "auto"
                });

                // Animate Text Distortion
                gsap.to(displacement, {
                    attr: { scale: 30 },
                    duration: 1,
                    ease: "power2.out"
                });
                gsap.to(turbulence, {
                    attr: { baseFrequency: 0.005 },
                    duration: 1,
                    ease: "power2.out"
                });
            });

            item.addEventListener("mouseleave", () => {
                // Animate Out Images
                gsap.to([previewLeftContainer, previewRightContainer], {
                    opacity: 0,
                    scale: 0.95,
                    duration: 0.4,
                    ease: "power2.out",
                    overwrite: "auto"
                });

                // Reset Text Distortion
                gsap.to(displacement, {
                    attr: { scale: 0 },
                    duration: 0.8,
                    ease: "power2.out"
                });
                gsap.to(turbulence, {
                    attr: { baseFrequency: 0.02 },
                    duration: 0.8,
                    ease: "power2.out"
                });
            });

            // Mouse move for subtle parallax on images?
            item.addEventListener("mousemove", (e) => {
                // Optional: Move images slightly based on cursor Y
                // const yPos = (e.clientY / window.innerHeight - 0.5) * 20;
                // gsap.to([previewLeftContainer, previewRightContainer], { y: `calc(-50% + ${yPos}px)`, duration: 0.5 });
            });
        });
    }

    // --- ANIMATIONS: SCRATCH EFFECT ---
    workItems.forEach((item, index) => {
        const title = item.querySelector(".project-title");
        if (!title) return;

        // 1. Create SVG Scratch
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("class", "scratch-svg");
        // Position absolute over the text
        svg.style.position = "absolute";
        svg.style.top = "-20%";
        svg.style.left = "5%";
        svg.style.width = "70%";
        svg.style.height = "140%";
        svg.style.pointerEvents = "none";
        svg.style.zIndex = "10";
        svg.style.overflow = "visible";

        // Define Gradient
        const defs = document.createElementNS(svgNS, "defs");
        const gradient = document.createElementNS(svgNS, "linearGradient");
        const gradientId = `scratch-gradient-${index}`;
        gradient.setAttribute("id", gradientId);
        gradient.setAttribute("x1", "0%");
        gradient.setAttribute("y1", "100%");
        gradient.setAttribute("x2", "100%");
        gradient.setAttribute("y2", "0%"); // Approx 45 degrees

        // Stops based on user request
        const stopsData = [
            { offset: "0%", color: "rgba(168, 19, 26, 1)" },
            { offset: "16%", color: "rgba(182, 51, 25, 1)" },
            { offset: "34%", color: "rgba(197, 108, 44, 1)" },
            { offset: "48%", color: "rgba(233, 181, 35, 1)" },
            { offset: "62%", color: "rgba(231, 179, 173, 1)" },
            { offset: "100%", color: "rgba(231, 179, 173, 1)" }
        ];

        stopsData.forEach(s => {
            const stop = document.createElementNS(svgNS, "stop");
            stop.setAttribute("offset", s.offset);
            stop.setAttribute("stop-color", s.color);
            gradient.appendChild(stop);
        });

        defs.appendChild(gradient);
        svg.appendChild(defs);

        // Generate random scratch path (curved/looped)
        const path = document.createElementNS(svgNS, "path");

        // Tighter viewbox for better control
        svg.setAttribute("viewBox", "0 0 200 60");
        svg.setAttribute("preserveAspectRatio", "none");

        // Generate points for a "looped" scribble
        // We'll use a series of Quadratic Bezier curves
        let d = "M0,30 ";
        let x = 0;
        let y = 30;
        const width = 200;
        const step = 50; // Much larger step for smoother, longer curves
        const amp = 20; // Reduced amplitude for subtler waves

        // Forward pass
        for (let i = 0; i <= width; i += step) {
            const nextX = i + step;
            const nextY = 30 + (Math.random() - 0.5) * amp * 2;

            if (i === 0) {
                // First curve needs explicit control point
                const cpX = (x + nextX) / 2;
                const cpY = 30 - amp;
                d += `Q${cpX},${cpY} ${nextX},${nextY} `;
            } else {
                // Subsequent curves use T for smooth connection (auto-calculated control point)
                d += `T${nextX},${nextY} `;
            }

            x = nextX;
            y = nextY;
        }

        // Backward pass (for density) - REMOVED for lighter look
        // A single pass is enough for a "light" scratch

        path.setAttribute("d", d);
        path.setAttribute("stroke", `url(#${gradientId})`); // Use the gradient
        path.setAttribute("stroke-width", "5.0"); // Slightly thicker
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");

        svg.appendChild(path);
        title.appendChild(svg);

        // Prepare for draw animation
        const length = path.getTotalLength();

        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
        path.style.opacity = 0; // Start invisible

        // 2. Animate on Hover
        item.addEventListener("mouseenter", () => {
            gsap.to(path, {
                strokeDashoffset: 0,
                opacity: 1,
                duration: 0.4,
                ease: "power2.out",
                overwrite: "auto"
            });
        });

        item.addEventListener("mouseleave", () => {
            gsap.to(path, {
                strokeDashoffset: length,
                opacity: 0,
                duration: 0.4,
                ease: "power2.in",
                overwrite: "auto"
            });
        });
    });

    console.log("Mirage Studio: Refined Experience Loaded");
}
