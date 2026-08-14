/* =========================================================
   TRADEVESTOR - MAIN JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("TradeVestor JS aktif");


    /* =====================================================
       MOBILE MENU
       ===================================================== */

    const menuToggle = document.querySelector(".menu-toggle");
    const navMenu = document.querySelector(".nav-menu");

    if (menuToggle && navMenu) {

        menuToggle.addEventListener("click", () => {

            navMenu.classList.toggle("active");
            menuToggle.classList.toggle("active");

        });

    }


    /* =====================================================
       TUTUP MENU SETELAH KLIK LINK
       ===================================================== */

    if (navMenu) {

        const navLinks = navMenu.querySelectorAll("a");

        navLinks.forEach(link => {

            link.addEventListener("click", () => {

                navMenu.classList.remove("active");

                if (menuToggle) {
                    menuToggle.classList.remove("active");
                }

            });

        });

    }


    /* =====================================================
       NAVBAR SCROLL EFFECT
       ===================================================== */

    const navbar = document.querySelector(".navbar");

    if (navbar) {

        const checkScroll = () => {

            if (window.scrollY > 30) {

                navbar.classList.add("scrolled");

            } else {

                navbar.classList.remove("scrolled");

            }

        };

        window.addEventListener("scroll", checkScroll);

        checkScroll();

    }


    /* =====================================================
       SMOOTH SCROLL
       ===================================================== */

    document.querySelectorAll('a[href^="#"]').forEach(link => {

        link.addEventListener("click", event => {

            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") {
                return;
            }

            const target = document.querySelector(targetId);

            if (!target) {
                return;
            }

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    });


    /* =====================================================
       CURRENT YEAR
       ===================================================== */

    document.querySelectorAll(".current-year").forEach(element => {

        element.textContent = new Date().getFullYear();

    });


    /* =====================================================
       SCROLL REVEAL
       ===================================================== */

    const revealElements = document.querySelectorAll(
        ".reveal, .fade-in, .animate"
    );

    if ("IntersectionObserver" in window) {

        const observer = new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add("show");

                        observer.unobserve(entry.target);

                    }

                });

            },
            {
                threshold: 0.15
            }
        );

        revealElements.forEach(element => {

            observer.observe(element);

        });

    } else {

        revealElements.forEach(element => {

            element.classList.add("show");

        });

    }


    /* =====================================================
       PREMIUM BUTTON
       ===================================================== */

    document.querySelectorAll("[data-premium]").forEach(button => {

        button.addEventListener("click", () => {

            window.location.href = "premium.html";

        });

    });


    /* =====================================================
       BACK TO TOP
       ===================================================== */

    const backTop = document.querySelector(".back-to-top");

    if (backTop) {

        window.addEventListener("scroll", () => {

            if (window.scrollY > 500) {

                backTop.classList.add("show");

            } else {

                backTop.classList.remove("show");

            }

        });

        backTop.addEventListener("click", () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        });

    }


    /* =====================================================
       DISABLE EMPTY LINKS
       ===================================================== */

    document.querySelectorAll('a[href="#"]').forEach(link => {

        link.addEventListener("click", event => {

            event.preventDefault();

        });

    });

});
