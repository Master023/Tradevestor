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

    const menuBtn =
        document.getElementById("menuBtn");

    const navLinks =
        document.getElementById("navLinks");


    if (!menuBtn || !navLinks) {
        return;
    }


    menuBtn.addEventListener("click", (event) => {

        event.stopPropagation();

        navLinks.classList.toggle("show");

        const isOpen =
            navLinks.classList.contains("show");

        menuBtn.setAttribute(
            "aria-expanded",
            isOpen ? "true" : "false"
        );

        menuBtn.setAttribute(
            "aria-label",
            isOpen
                ? "Tutup menu"
                : "Buka menu"
        );

    });


    // Tutup menu ketika link diklik

    const links =
        navLinks.querySelectorAll("a");


    links.forEach((link) => {

        link.addEventListener("click", () => {

            navLinks.classList.remove("show");

            menuBtn.setAttribute(
                "aria-expanded",
                "false"
            );

            menuBtn.setAttribute(
                "aria-label",
                "Buka menu"
            );

        });

    });


    // Tutup menu jika klik di luar navbar

    document.addEventListener("click", (event) => {

        const navbar =
            document.querySelector(".navbar");

        if (
            navbar &&
            !navbar.contains(event.target)
        ) {

            navLinks.classList.remove("show");

            menuBtn.setAttribute(
                "aria-expanded",
                "false"
            );

            menuBtn.setAttribute(
                "aria-label",
                "Buka menu"
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


    // --------------------------------------------------------
    // Auth system belum tersedia
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // Cek user
    // --------------------------------------------------------

    try {

        const result =
            await window.TradeVestorAuth
                .getCurrentUser();


        if (
            !result ||
            !result.ok ||
            !result.data ||
            !result.data.success
        ) {

            renderLoggedOut(navAuth);

            return;

        }


        const user =
            result.data.user;


        renderLoggedIn(
            navAuth,
            user
        );


    } catch (error) {

        console.error(
            "NAVBAR AUTH ERROR:",
            error
        );

        renderLoggedOut(navAuth);

    }

}


// ============================================================
// USER BELUM LOGIN
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
// USER SUDAH LOGIN
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


    const logoutButton =
        document.getElementById(
            "navLogout"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        handleNavbarLogout
    );

}


// ============================================================
// LOGOUT
// ============================================================

async function handleNavbarLogout(event) {

    event.preventDefault();

    event.stopPropagation();


    const logoutButton =
        event.currentTarget;


    if (
        !window.TradeVestorAuth ||
        typeof window.TradeVestorAuth.logoutUser !==
        "function"
    ) {

        console.error(
            "logoutUser() tidak ditemukan."
        );

        return;

    }


    // Cegah double click

    if (logoutButton.disabled) {
        return;
    }


    logoutButton.disabled = true;

    logoutButton.textContent = "...";


    try {

        const result =
            await window.TradeVestorAuth
                .logoutUser();


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


        console.error(
            "Logout gagal:",
            result?.data
        );


        logoutButton.disabled = false;

        logoutButton.textContent =
            "Logout";


        alert(
            result?.data?.message ||
            "Logout gagal."
        );


    } catch (error) {

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


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

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


    if (
        !("IntersectionObserver" in window)
    ) {

        elements.forEach(
            element => {

                element.classList.add(
                    "visible"
                );

            }
        );

        return;

    }


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

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

                    }
                );

            },
            {
                threshold: 0.12
            }
        );


    elements.forEach(
        element => {

            observer.observe(
                element
            );

        }
    );

}
