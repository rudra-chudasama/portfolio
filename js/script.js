// script.js — FIXED WITH CERTIFICATIONS SUPPORT
(() => {
    "use strict";

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
        if (!themeBtn) return;

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
            const btn = document.getElementById('theme');
            if (btn) {
                btn.textContent = theme === 'dark' ? '☀️' : '🌙';
                btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
            }
        }

        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme');
            applyTheme(current === 'dark' ? 'light' : 'dark');
        }

        applyTheme(getPreferredTheme());
        themeBtn.addEventListener('click', toggleTheme);

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
        });
    }

    /* ---------------------------
       MOBILE NAV TOGGLE
    ----------------------------*/
    function initMobileMenu() {
        const menuToggle = $("#menu-toggle");
        const sideMenu   = $("#side");
        if (!menuToggle || !sideMenu) return;

        menuToggle.setAttribute("role", "button");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Toggle navigation menu");

        const close = () => {
            menuToggle.classList.remove("active");
            sideMenu.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
            document.body.style.overflow = '';
        };

        menuToggle.addEventListener("click", () => {
            const opened = menuToggle.classList.toggle("active");
            sideMenu.classList.toggle("open", opened);
            menuToggle.setAttribute("aria-expanded", String(opened));
            document.body.style.overflow = opened ? 'hidden' : '';
        }, { passive: true });

        $$("#side h4 a").forEach(link => link.addEventListener("click", close));

        document.addEventListener('click', e => {
            if (sideMenu.classList.contains('open') &&
                !sideMenu.contains(e.target) &&
                !menuToggle.contains(e.target)) close();
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && sideMenu.classList.contains('open')) close();
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
                    if (typeof gsap !== "undefined" && typeof ScrollToPlugin !== "undefined") {
                        gsap.to(window, { duration: 1, scrollTo: target, ease: "power2.inOut" });
                    } else {
                        target.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                } catch {
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            });
        });
    }

    /* ---------------------------
       ACTIVE LINK DETECTION
    ----------------------------*/
    function initActiveLinks() {
        const sections = [
            { id: "#main",                   link: '#side h4 a[href="#main"]' },
            { id: "#main2",                  link: '#side h4 a[href="#main2"]' },
            { id: "#main3",                  link: '#side h4 a[href="#main3"]' },
            { id: "#projects-section",       link: '#side h4 a[href="#projects-section"]' },
            { id: "#certifications-section", link: '#side h4 a[href="#certifications-section"]' },
            { id: "#resume-section",         link: '#side h4 a[href="#resume-section"]' },
            { id: "#contact-section",        link: '#side h4 a[href="#contact-section"]' },
        ];

        const navLinks = $$("#side h4 a");

        function clearActive() {
            navLinks.forEach(l => l.classList.remove("active"));
        }

        function setActive(selector) {
            clearActive();
            const el = $(selector);
            if (el) el.classList.add("active");
        }

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sec = sections.find(s => s.id === `#${entry.target.id}`);
                    if (sec) setActive(sec.link);
                }
            });
        }, { root: null, rootMargin: '-20% 0px -60% 0px', threshold: 0 });

        sections.forEach(sec => {
            const el = $(sec.id);
            if (el) observer.observe(el);
        });

        window.addEventListener('scroll', debounce(() => {
            const scrollTop   = window.pageYOffset || document.documentElement.scrollTop;
            const docHeight   = document.documentElement.scrollHeight;
            const winHeight   = window.innerHeight;
            if (scrollTop < 100) {
                setActive('#side h4 a[href="#main"]');
            } else if (scrollTop + winHeight >= docHeight - 50) {
                setActive('#side h4 a[href="#contact-section"]');
            }
        }, 100));

        setActive('#side h4 a[href="#main"]');
    }

    /* ---------------------------
       GSAP ANIMATIONS
    ----------------------------*/
    function initGSAPAnimations() {
        if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
            console.warn("GSAP or ScrollTrigger not loaded. Animations disabled.");
            // Make sure cert cards are visible as fallback
            $$(".skill-box").forEach(b => { b.style.opacity = "1"; b.style.visibility = "visible"; });
            return;
        }

        try { gsap.registerPlugin(ScrollTrigger); } catch (e) { /* ignore */ }

        // Kill any existing triggers
        ScrollTrigger.getAll().forEach(st => st.kill());

        const mobile      = isMobile();
        const sectionStart = mobile ? "top 90%" : "top 80%";

        const st = (trigger, extra = {}) => ({
            trigger,
            start: sectionStart,
            end: "bottom top",
            toggleActions: "play reverse play reverse",
            ...extra,
        });

        // Helper to animate section heading + children
        function animateSection(sectionId, extraTargets = []) {
            const heading = $(`${sectionId} h2`);
            if (heading) {
                gsap.from(`${sectionId} h2`, {
                    y: 80, opacity: 0, duration: 1, ease: "power2.out",
                    scrollTrigger: st(sectionId)
                });
            }
            extraTargets.forEach(({ sel, opts }) => {
                if (exists(sel)) {
                    gsap.from(sel, { y: 80, opacity: 0, duration: 1, ease: "power2.out", ...opts,
                        scrollTrigger: st(sectionId) });
                }
            });
        }

        // ── NAV
        gsap.from("#nav", { y: -50, opacity: 0, duration: 0.8, ease: "power2.out" });

        // ── HERO
        if (exists("#main h3")) {
            gsap.from("#main h3", { y: 50, opacity: 0, duration: 1, stagger: 0.2, ease: "power2.out", delay: 0.3 });
        }
        if (exists("#main p")) {
            gsap.from("#main p", { y: 30, opacity: 0, duration: 1, ease: "power2.out", delay: 0.6 });
        }
        if (exists("#main #img img")) {
            gsap.from("#main #img img", { y: 50, opacity: 0, scale: 0.8, duration: 1.2, ease: "power3.out", delay: 0.4 });
        }

        // ── ABOUT
        animateSection("#main2", [
            { sel: "#main2 p",              opts: { stagger: 0.15 } },
            { sel: "#main2 .highlight-box", opts: {} },
        ]);

        // ── SKILLS
        animateSection("#main3");
        const skillBoxes = $$(".skill-box");
        if (skillBoxes.length) {
            // Reset visibility first
            skillBoxes.forEach(b => { b.style.opacity = "1"; b.style.visibility = "visible"; });
            gsap.fromTo(".skill-box",
                { y: 80, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: "power2.out",
                  scrollTrigger: st("#main3") }
            );
        }

        // ── PROJECTS
        animateSection("#projects-section", [
            { sel: ".project-card", opts: {} }
        ]);

        // ── CERTIFICATIONS — cards reuse .skill-box but scoped to the section
        if (exists("#certifications-section")) {
            gsap.from("#certifications-section h2", {
                y: 80, opacity: 0, duration: 1, ease: "power2.out",
                scrollTrigger: st("#certifications-section")
            });

            const certCards = $$("#certifications-section .skill-box");
            if (certCards.length) {
                // Make sure they start invisible for animation
                certCards.forEach(b => { b.style.opacity = "0"; b.style.visibility = "visible"; });
                gsap.fromTo(certCards,
                    { y: 80, opacity: 0 },
                    {
                        y: 0, opacity: 1,
                        duration: 0.9,
                        stagger: 0.08,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: "#certifications-section",
                            start: sectionStart,
                            end: "bottom top",
                            toggleActions: "play reverse play reverse",
                        }
                    }
                );
            }
        }

        // ── RESUME
        animateSection("#resume-section", [
            { sel: "#resume-section p",          opts: {} },
            { sel: "#resume-section .resume-btn", opts: {} },
        ]);

        // ── CONTACT
        animateSection("#contact-section", [
            { sel: "#contact-section p",            opts: { stagger: 0.1 } },
            { sel: "#contact-section .contact-info", opts: {} },
        ]);

        console.log("GSAP animations initialized ✓");
    }

    /* ---------------------------
       CODE PROTECTION
    ----------------------------*/
    function initCodeProtection() {
        document.addEventListener('contextmenu', e => { e.preventDefault(); return false; });
        document.addEventListener('selectstart', e => { e.preventDefault(); return false; });
        document.addEventListener('dragstart',   e => { e.preventDefault(); return false; });

        document.addEventListener('keydown', e => {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && ['I','J','C','K'].includes(e.key)) ||
                (e.ctrlKey && ['u','s','p'].includes(e.key))
            ) {
                e.preventDefault();
                return false;
            }
        });

        const style = document.createElement('style');
        style.textContent = `
            * { -webkit-user-select:none!important; -moz-user-select:none!important; -ms-user-select:none!important; user-select:none!important; }
            img { -webkit-user-drag:none!important; pointer-events:none!important; }
        `;
        document.head.appendChild(style);
    }

    /* ---------------------------
       INIT
    ----------------------------*/
    function initAll() {
        initCodeProtection();
        initThemeSystem();
        initMobileMenu();
        initSmoothScroll();
        initActiveLinks();
        setTimeout(() => initGSAPAnimations(), 100);
        console.log('Portfolio initialized ✓');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }

})();
