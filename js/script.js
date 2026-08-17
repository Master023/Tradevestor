// ============================================================
// TRADEVESTOR MAIN SCRIPT
// ============================================================


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initMobileMenu();

        initNavbarAuth();

        initRevealAnimation();

    }
);


// ============================================================
// MOBILE MENU
// ============================================================

function initMobileMenu() {

    const menuBtn =
        document.getElementById(
            "menuBtn"
        );

    const navLinks =
        document.getElementById(
            "navLinks"
        );


    if (!menuBtn || !navLinks) {

        return;

    }


    menuBtn.addEventListener(
        "click",
        () => {

            navLinks.classList.toggle(
                "show"
            );

        }
    );


    // --------------------------------------------------------
    // Tutup menu ketika link diklik
    // --------------------------------------------------------

    const links =
        navLinks.querySelectorAll(
            "a"
        );


    links.forEach(
        link => {

            link.addEventListener(
                "click",
                () => {

                    navLinks.classList.remove(
                        "show"
                    );

                }
            );

        }
    );

}


// ============================================================
// NAVBAR AUTH
// ============================================================

async function initNavbarAuth() {

    const navAuth =
        document.getElementById(
            "navAuth"
        );


    // --------------------------------------------------------
    // Kalau halaman tidak memiliki navbar auth
    // --------------------------------------------------------

    if (!navAuth) {

        return;

    }


    // --------------------------------------------------------
    // Pastikan TradeVestorAuth tersedia
    // --------------------------------------------------------

    if (
        typeof TradeVestorAuth ===
        "undefined"
    ) {

        console.error(
            "TradeVestorAuth tidak ditemukan. Pastikan auth.js dimuat sebelum script.js."
        );

        renderLoggedOut(
            navAuth
        );

        return;

    }


    // --------------------------------------------------------
    // Cek session user
    // --------------------------------------------------------

    try {

        const result =
            await TradeVestorAuth
                .getCurrentUser();


        // ====================================================
        // BELUM LOGIN
        // ====================================================

        if (
            !result.ok ||
            !result.data ||
            !result.data.success
        ) {

            renderLoggedOut(
                navAuth
            );

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


    } catch (error) {

        console.error(
            "NAVBAR AUTH ERROR:",
            error
        );


        renderLoggedOut(
            navAuth
        );

    }

}


// ============================================================
// RENDER LOGGED OUT
// ============================================================

function renderLoggedOut(
    navAuth
) {

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
// RENDER LOGGED IN
// ============================================================

function renderLoggedIn(
    navAuth,
    user
) {

    const name =
        escapeHTML(
            user?.name ||
            "User"
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
        async () => {

            // ------------------------------------------------
            // Cegah klik berkali-kali
            // ------------------------------------------------

            logoutButton.disabled =
                true;

            logoutButton.textContent =
                "...";


            try {

                const result =
                    await TradeVestorAuth
                        .logoutUser();


                // ============================================
                // LOGOUT BERHASIL
                // ============================================

                if (
                    result.ok &&
                    result.data &&
                    result.data.success
                ) {

                    window.location.href =
                        "index.html";

                    return;

                }


                // ============================================
                // LOGOUT GAGAL
                // ============================================

                console.error(
                    "Logout gagal:",
                    result.data
                );


                logoutButton.disabled =
                    false;

                logoutButton.textContent =
                    "Logout";


                alert(
                    result.data?.message ||
                    "Logout gagal."
                );


            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );


                logoutButton.disabled =
                    false;

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
// Mencegah nama user memasukkan HTML/JavaScript
// ke dalam navbar.
// ============================================================

function escapeHTML(
    value
) {

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
// Animasi sederhana ketika elemen masuk viewport.
// Kalau CSS tidak memiliki .reveal,
// fungsi ini tidak akan mengganggu halaman.
// ============================================================

function initRevealAnimation() {

    const elements =
        document.querySelectorAll(
            ".reveal"
        );


    if (!elements.length) {

        return;

    }


    // --------------------------------------------------------
    // Browser tidak mendukung IntersectionObserver
    // --------------------------------------------------------

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
