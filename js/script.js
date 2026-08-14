/* =====================================================
   TRADEVESTOR - MAIN JAVASCRIPT
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    console.log("TradeVestor JS aktif");


    /* =====================================================
       MOBILE NAVIGATION
    ===================================================== */

    const menuBtn = document.getElementById("menuBtn");
    const navLinks = document.getElementById("navLinks");

    if (menuBtn && navLinks) {

        menuBtn.addEventListener("click", function () {

            navLinks.classList.toggle("active");

            menuBtn.classList.toggle("active");

            const isOpen = navLinks.classList.contains("active");

            menuBtn.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );

        });

    }


    /* =====================================================
       TUTUP MENU SETELAH LINK DIKLIK
    ===================================================== */

    if (navLinks) {

        const links = navLinks.querySelectorAll("a");

        links.forEach(function (link) {

            link.addEventListener("click", function () {

                navLinks.classList.remove("active");

                if (menuBtn) {
                    menuBtn.classList.remove("active");

                    menuBtn.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }

            });

        });

    }


    /* =====================================================
       NAVBAR SCROLL EFFECT
    ===================================================== */

    const navbar = document.querySelector(".navbar");

    if (navbar) {

        function checkNavbarScroll() {

            if (window.scrollY > 30) {

                navbar.classList.add("scrolled");

            } else {

                navbar.classList.remove("scrolled");

            }

        }

        window.addEventListener(
            "scroll",
            checkNavbarScroll
        );

        checkNavbarScroll();

    }


    /* =====================================================
       SMOOTH SCROLL
    ===================================================== */

    const anchorLinks =
        document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId =
                this.getAttribute("href");

            if (
                !targetId ||
                targetId === "#"
            ) {
                return;
            }

            const target =
                document.querySelector(targetId);

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
       ANIMATION / REVEAL
    ===================================================== */

    const revealElements =
        document.querySelectorAll(
            ".reveal, .fade-in, .animate"
        );

    if (
        revealElements.length > 0 &&
        "IntersectionObserver" in window
    ) {

        const observer =
            new IntersectionObserver(
                function (entries) {

                    entries.forEach(function (entry) {

                        if (entry.isIntersecting) {

                            entry.target.classList.add(
                                "show"
                            );

                            observer.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: 0.15
                }
            );

        revealElements.forEach(function (element) {

            observer.observe(element);

        });

    } else {

        revealElements.forEach(function (element) {

            element.classList.add("show");

        });

    }


    /* =====================================================
       CURRENT YEAR
    ===================================================== */

    const yearElements =
        document.querySelectorAll(".current-year");

    yearElements.forEach(function (element) {

        element.textContent =
            new Date().getFullYear();

    });


    /* =====================================================
       CLOSE MOBILE MENU WHEN CLICK OUTSIDE
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            if (!menuBtn || !navLinks) {
                return;
            }

            const clickedInsideMenu =
                navLinks.contains(event.target);

            const clickedButton =
                menuBtn.contains(event.target);

            if (
                !clickedInsideMenu &&
                !clickedButton
            ) {

                navLinks.classList.remove("active");

                menuBtn.classList.remove("active");

                menuBtn.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );


    /* =====================================================
       BACK TO TOP
    ===================================================== */

    const backTop =
        document.querySelector(".back-to-top");

    if (backTop) {

        window.addEventListener(
            "scroll",
            function () {

                if (window.scrollY > 500) {

                    backTop.classList.add("show");

                } else {

                    backTop.classList.remove("show");

                }

            }
        );

        backTop.addEventListener(
            "click",
            function () {

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }


});
