Script.js TradeVestor — Navbar & Auth Terbaru

// ============================================================
// TRADEVESTOR MAIN SCRIPT
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    initMobileMenu();

    initNavbarAuth();

    initRevealAnimation();

});


// ============================================================
// MOBILE MENU
// ============================================================

function initMobileMenu() {

    const menuBtn = document.getElementById("menuBtn");
    const navLinks = document.getElementById("navLinks");

    if (!menuBtn || !navLinks) {
        console.warn("Navbar menu tidak ditemukan.");
        return;
    }


    // ========================================================
    // HAMBURGER CLICK
    // ========================================================

    menuBtn.addEventListener("click", function (event) {

        event.preventDefault();
        event.stopPropagation();

        navLinks.classList.toggle("show");

        const isOpen =
            navLinks.classList.contains("show");

        menuBtn.setAttribute(
            "aria-expanded",
            isOpen ? "true" : "false"
        );

        // Ubah icon
        menuBtn.textContent =
            isOpen ? "✕" : "☰";

    });


    // ========================================================
    // LINK NAVIGATION
    // ========================================================

    const links =
        navLinks.querySelectorAll("a");

    links.forEach(link => {

        link.addEventListener("click", () => {

            navLinks.classList.remove("show");

            menuBtn.textContent = "☰";

            menuBtn.setAttribute(
                "aria-expanded",
                "false"
            );

        });

    });


    // ========================================================
    // KLIK DI LUAR MENU
    // ========================================================

    document.addEventListener("click", function (event) {

        const clickedInsideMenu =
            navLinks.contains(event.target);

        const clickedMenuButton =
            menuBtn.contains(event.target);

        if (
            !clickedInsideMenu &&
            !clickedMenuButton
        ) {

            navLinks.classList.remove("show");

            menuBtn.textContent = "☰";

            menuBtn.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    });

}


// ============================================================
// NAVBAR AUTH
// ============================================================

async function initNavbarAuth() {

    const navAuth =
        document.getElementById("navAuth");

    if (!navAuth) {
        return;
    }


    // ========================================================
    // CEK AUTH SYSTEM
    // ========================================================

    if (
        typeof window.TradeVestorAuth ===
        "undefined"
    ) {

        console.error(
            "TradeVestorAuth tidak ditemukan."
        );

        renderLoggedOut(navAuth);

        return;

    }


    // ========================================================
    // CEK SESSION
    // ========================================================

    try {

        const result =
            await window.TradeVestorAuth
                .getCurrentUser();


        // ====================================================
        // BELUM LOGIN
        // ====================================================

        if (
            !result ||
            !result.ok ||
            !result.data ||
            !result.data.success
        ) {

            renderLoggedOut(navAuth);

            return;

        }


        // ====================================================
        // SUDAH LOGIN
        // ====================================================

        const user =
            result.data.user;

        renderLoggedIn(
            navAuth,
            user
        );

    }

    catch (error) {

        console.error(
            "NAVBAR AUTH ERROR:",
            error
        );

        renderLoggedOut(navAuth);

    }

}


// ============================================================
// LOGGED OUT
// ============================================================

function renderLoggedOut(navAuth) {

    navAuth.innerHTML = `

        <a
            href="login.html"
            class="nav-login"
        >
            Login / Register
        </a>

    `;

}


// ============================================================
// LOGGED IN
// ============================================================

function renderLoggedIn(
    navAuth,
    user
) {

    const name =
        escapeHTML(
            user?.name || "User"
        );


    navAuth.innerHTML = `

        <span
            class="nav-user"
            title="${name}"
        >
            ${name}
        </span>

        <button
            type="button"
            class="nav-logout"
            id="navLogout"
        >
            Logout
        </button>

    `;


    // ========================================================
    // LOGOUT BUTTON
    // ========================================================

    const logoutButton =
        document.getElementById(
            "navLogout"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();
            event.stopPropagation();


            // ------------------------------------------------
            // Cegah double click
            // ------------------------------------------------

            logoutButton.disabled = true;

            logoutButton.textContent = "...";


            try {

                const result =
                    await window.TradeVestorAuth
                        .logoutUser();


                // ============================================
                // BERHASIL
                // ============================================

                if (
                    result &&
                    result.ok &&
                    result.data &&
                    result.data.success
                ) {

                    window.location.href =
                        "index.html";

                    return;

                }


                // ============================================
                // GAGAL
                // ============================================

                console.error(
                    "Logout gagal:",
                    result
                );


                logoutButton.disabled = false;

                logoutButton.textContent =
                    "Logout";


                alert(
                    result?.data?.message ||
                    "Logout gagal."
                );

            }

            catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );


                logoutButton.disabled = false;

                logoutButton.textContent =
                    "Logout";


                alert(
                    "Tidak dapat terhubung ke server."
                );

            }

        }
    );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// REVEAL ANIMATION
// ============================================================

function initRevealAnimation() {

    const elements =
        document.querySelectorAll(
            ".reveal"
        );


    if (!elements.length) {
        return;
    }


    // ========================================================
    // FALLBACK
    // ========================================================

    if (
        !("IntersectionObserver" in window)
    ) {

        elements.forEach(element => {

            element.classList.add(
                "visible"
            );

        });

        return;

    }


    // ========================================================
    // OBSERVER
    // ========================================================

    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target.classList.add(
                            "visible"
                        );

                        observer.unobserve(
                            entry.target
                        );

                    }

                });

            },
            {
                threshold: 0.12
            }
        );


    elements.forEach(element => {

        observer.observe(element);

    });

}
