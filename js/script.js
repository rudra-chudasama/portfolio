// script.js — FIXED ACTIVE LINK DETECTION
(() => {
    "use strict";

    /* ---------------------------
       HELPERS
    ----------------------------*/
    const $ = sel => document.querySelector(sel);
    const $$ = sel => Array.from(document.querySelectorAll(sel));
    const exists = sel => !!document.querySelector(sel);

    function debounce(fn, delay = 160) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    function isMobile() {
        return window.innerWidth <= 768;
    }

    /* ---------------------------
       THEME SYSTEM
    ----------------------------*/
    function initThemeSystem() {
        const themeBtn = document.getElementById('theme');

        if (!themeBtn) {
            console.error('Theme button not found!');
            return;
        }

        function getPreferredTheme() {
            const saved = localStorage.getItem('theme');
            if (saved) return saved;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        function applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            updateThemeButton(theme);
        }

        function updateThemeButton(theme) {
            const themeBtn = document.getElementById('theme');
            if (themeBtn) {
                themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
                themeBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
            }
        }

        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        }

        // Initialize
        const initialTheme = getPreferredTheme();
        applyTheme(initialTheme);

        // Add event listener
        themeBtn.addEventListener('click', toggleTheme);

        // Listen for system changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    /* ---------------------------
       MOBILE NAV TOGGLE
    ----------------------------*/
    function initMobileMenu() {
        const menuToggle = $("#menu-toggle");
        const sideMenu = $("#side");

        if (!menuToggle || !sideMenu) {
            console.error('Mobile menu elements not found!');
            return;
        }

        menuToggle.setAttribute("role", "button");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Toggle navigation menu");

        const toggleMobileMenu = () => {
            const opened = menuToggle.classList.toggle("active");
            sideMenu.classList.toggle("open", opened);
            menuToggle.setAttribute("aria-expanded", String(opened));
            document.body.style.overflow = opened ? 'hidden' : '';
        };

        menuToggle.addEventListener("click", toggleMobileMenu, { passive: true });

        const navLinks = $$("#side h4 a");
        navLinks.forEach(link => {
            link.addEventListener("click", () => {
                menuToggle.classList.remove("active");
                sideMenu.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
                document.body.style.overflow = '';
            });
        });

        document.addEventListener('click', (e) => {
            if (sideMenu.classList.contains('open') &&
                !sideMenu.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                menuToggle.classList.remove("active");
                sideMenu.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
                document.body.style.overflow = '';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sideMenu.classList.contains('open')) {
                menuToggle.classList.remove("active");
                sideMenu.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
                document.body.style.overflow = '';
            }
        });
    }

    /* ---------------------------
       SMOOTH SCROLL
    ----------------------------*/
    function initSmoothScroll() {
        $$("#side h4 a").forEach(link => {
            link.addEventListener("click", e => {
                const href = link.getAttribute("href");
                if (!href || !href.startsWith('#')) return;

                e.preventDefault();
                const target = $(href);
                if (!target) return;

                try {
                    if (typeof gsap !== "undefined" && gsap.utils.checkPrefix("scrollTo")) {
                        gsap.to(window, {
                            duration: 1,
                            scrollTo: target,
                            ease: "power2.inOut"
                        });
                    } else {
                        target.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });
                    }
                } catch (err) {
                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            });
        });
    }

    /* ---------------------------
       FIXED: ACTIVE LINK DETECTION
       Uses intersection observer for accurate detection
    ----------------------------*/
    function initActiveLinks() {
        const sections = [
            { id: "#main", link: '#side h4 a[href="#main"]' },
            { id: "#main2", link: '#side h4 a[href="#main2"]' },
            { id: "#main3", link: '#side h4 a[href="#main3"]' },
            { id: "#projects-section", link: '#side h4 a[href="#projects-section"]' },
            { id: "#certifications-section", link: '#side h4 a[href="#certifications-section"]' },
            { id: "#resume-section", link: '#side h4 a[href="#resume-section"]' },
            { id: "#contact-section", link: '#side h4 a[href="#contact-section"]' }
        ];

        const navLinks = $$("#side h4 a");

        // Clear all active states
        function clearActive() {
            navLinks.forEach(link => link.classList.remove("active"));
        }

        // Set active link
        function setActive(linkSelector) {
            clearActive();
            const link = $(linkSelector);
            if (link) {
                link.classList.add("active");
            }
        }

        // Intersection Observer for accurate section detection
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -60% 0px', // Trigger when section is in middle of viewport
            threshold: 0
        };

        let currentActive = null;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = `#${entry.target.id}`;
                    const section = sections.find(s => s.id === sectionId);

                    if (section) {
                        currentActive = section.link;
                        setActive(section.link);
                    }
                }
            });
        }, observerOptions);

        // Observe all sections
        sections.forEach(sec => {
            const element = $(sec.id);
            if (element) {
                observer.observe(element);
            }
        });

        // Fallback for edge cases (top and bottom of page)
        window.addEventListener('scroll', debounce(() => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight;
            const windowHeight = window.innerHeight;

            // At the very top - activate Home
            if (scrollTop < 100) {
                setActive('#side h4 a[href="#main"]');
            }
            // At the very bottom - activate Contact
            else if (scrollTop + windowHeight >= docHeight - 50) {
                setActive('#side h4 a[href="#contact-section"]');
            }
        }, 100));

        // Set initial active state
        setActive('#side h4 a[href="#main"]');
    }

    /* ---------------------------
       GSAP ANIMATIONS
    ----------------------------*/
    function initGSAPAnimations() {
        if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
            console.warn("GSAP or ScrollTrigger not found. Animations disabled.");
            return;
        }

        try {
            gsap.registerPlugin(ScrollTrigger);
        } catch (e) { /* ignore */ }

        function killAll() {
            try {
                ScrollTrigger.getAll().forEach(st => st.kill());
            } catch (e) { /* ignore */ }
        }

        killAll();

        const mobile = isMobile();
        const sectionStart = mobile ? "top 90%" : "top 80%";

        // NAV entrance animation
        gsap.from("#nav", {
            y: -50,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out"
        });

        // HERO SECTION ANIMATIONS
        if (exists("#main h3")) {
            gsap.from("#main h3", {
                y: 50,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: "power2.out",
                delay: 0.3
            });
        }

        if (exists("#main p")) {
            gsap.from("#main p", {
                y: 30,
                opacity: 0,
                duration: 1,
                ease: "power2.out",
                delay: 0.6
            });
        }

        if (exists("#main #img img")) {
            gsap.from("#main #img img", {
                y: 50,
                opacity: 0,
                scale: 0.8,
                duration: 1.2,
                ease: "power3.out",
                delay: 0.4
            });
        }

        // ABOUT SECTION
        if (exists("#main2 h2")) {
            gsap.from("#main2 h2", {
                y: 100,
                opacity: 0,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#main2",
                    start: sectionStart,
                    end: "bottom top",
                    toggleActions: "play reverse play reverse"
                }
            });
        }

        if (exists("#main2 p")) {
            gsap.from("#main2 p", {
                y: 80,
                opacity: 0,
                duration: 1,
                stagger: 0.15,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#main2",
                    start: sectionStart,
                    end: "bottom top",
                    toggleActions: "play reverse play reverse"
                }
            });
        }

        // SKILLS SECTION
        if (exists("#main3 h2")) {
            gsap.from("#main3 h2", {
                y: 100,
                opacity: 0,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#main3",
                    start: sectionStart,
                    end: "bottom top",
                    toggleActions: "play reverse play reverse"
                }
            });
        }

        const skillBoxes = $$(".skill-box");
        if (skillBoxes.length) {
            skillBoxes.forEach(box => {
                box.style.opacity = "1";
                box.style.visibility = "visible";
            });

            gsap.fromTo("#main3 .skill-box", { y: 100, opacity: 0 }, {
                y: 0,
                opacity: 1,
                duration: 1,
                stagger: 0.1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#main3",
                    start: sectionStart,
                    end: "bottom top",
                    toggleActions: "play reverse play reverse"
                }
            });
        }

        // PROJECTS SECTION
        if (exists("#projects-section h2")) {
            gsap.from("#projects-section h2", {
                y: 100,
                opacity: 0,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#projects-section",
                    start: sectionStart,
                    end: "bottom top",
                    toggleActions: "play reverse play reverse"
                }
            });
        }

        if ($$(".project-card").length) {
            gsap.from(".project-card", {
                y: 100,
                opacity: 0,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#projects-section",
                    start: sectionStart,
                    end: "bottom top",
                    toggleActions: "play reverse play reverse"
                }
            });
        }

        // CERTIFICATIONS SECTION
        if (exists("#certifications-section")) {
            gsap.from("#certifications-section h2", {
                y: 100,
                opacity: 0,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#certifications-section",
                    start: "top 95%",
                    end: "bottom top",
                    toggleActions: "play reverse play reverse"
                }
            });

            const certCards = Array.from(document.querySelectorAll("#certifications-section .skill-box"));
            if (certCards.length) {
                certCards.forEach((card, i) => {
                    card.style.opacity = "1";
                    card.style.visibility = "visible";
                    gsap.fromTo(card,
                        { y: 80, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.8,
                            delay: i * 0.06,
                            ease: "power2.out",
                            scrollTrigger: {
                                trigger: card,
                                start: "top 98%",
                                end: "bottom top",
                                toggleActions: "play reverse play reverse"
                            }
                        }
                    );
                });
            }
        }

        // RESUME SECTION
        if (exists("#resume-section h2")) {
            gsap.from("#resume-section h2", {
                y: 100,
                opacity: 0,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#resume-section",
                    start: sectionStart,
                    end: "bottom top",
                    toggleActions: "play reverse play reverse"
                }
            });
        }

        if (exists("#resume-section p")) {
            gsap.from("#resume-section p", {
                y: 80,
                opacity: 0,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#resume-section",
                    start: sectionStart,
                    end: "bottom top",
                    toggleActions: "play reverse play reverse"
                }
            });
        }

        if (exists("#resume-section .resume-btn")) {
            gsap.from("#resume-section .resume-btn", {
                y: 80,
                opacity: 0,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#resume-section",
                    start: sectionStart,
                    end: "bottom top",
                    toggleActions: "play reverse play reverse"
                }
            });
        }

        // CONTACT SECTION
        if (exists("#contact-section h2")) {
            gsap.from("#contact-section h2", {
                y: 100,
                opacity: 0,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#contact-section",
                    start: sectionStart,
                    end: "bottom top",
                    toggleActions: "play reverse play reverse"
                }
            });
        }

        if (exists("#contact-section p")) {
            gsap.from("#contact-section p", {
                y: 80,
                opacity: 0,
                duration: 1,
                stagger: 0.1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#contact-section",
                    start: sectionStart,
                    end: "bottom top",
                    toggleActions: "play reverse play reverse"
                }
            });
        }

        if (exists("#contact-section .contact-info")) {
            gsap.from("#contact-section .contact-info", {
                y: 80,
                opacity: 0,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#contact-section",
                    start: sectionStart,
                    end: "bottom top",
                    toggleActions: "play reverse play reverse"
                }
            });
        }

        console.log("GSAP animations initialized");
    }

    /* ---------------------------
       CODE PROTECTION
    ----------------------------*/
    function initCodeProtection() {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        document.addEventListener('selectstart', (e) => {
            e.preventDefault();
            return false;
        });

        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.key === 'u') ||
                (e.ctrlKey && e.key === 's') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.shiftKey && e.key === 'K') ||
                (e.ctrlKey && e.key === 'p')) {
                e.preventDefault();
                return false;
            }
        });


        const style = document.createElement('style');
        style.textContent = `
            * {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
            }
            img {
                -webkit-user-drag: none !important;
                pointer-events: none !important;
            }`;
        document.head.appendChild(style);
    }

    /* ---------------------------
       INITIALIZATION
    ----------------------------*/
    function initAll() {
        initCodeProtection();
        initThemeSystem();
        initMobileMenu();
        initSmoothScroll();
        initActiveLinks();

        setTimeout(() => {
            initGSAPAnimations();
        }, 100);

        console.log('Portfolio initialized - Active links fixed!');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }

})();
