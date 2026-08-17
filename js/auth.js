// ============================================================
// TRADEVESTOR AUTH SYSTEM
// ============================================================

const API_BASE = "";


// ============================================================
// API REQUEST
// ============================================================

async function apiRequest(endpoint, options = {}) {

    const config = {
        method: options.method || "GET",

        credentials: "include",

        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    };


    if (options.body !== undefined) {

        config.body =
            JSON.stringify(options.body);

    }


    const response =
        await fetch(
            `${API_BASE}${endpoint}`,
            config
        );


    let data = {};


    try {

        data =
            await response.json();

    } catch (error) {

        data = {

            success: false,

            message:
                "Server mengembalikan response yang tidak valid."

        };

    }


    return {

        ok:
            response.ok,

        status:
            response.status,

        data

    };

}


// ============================================================
// LOGIN
// ============================================================

async function loginUser(
    email,
    password
) {

    return apiRequest(
        "/api/login",
        {

            method:
                "POST",

            body: {

                email,
                password

            }

        }
    );

}


// ============================================================
// REGISTER
// ============================================================

async function registerUser(
    name,
    email,
    password
) {

    return apiRequest(
        "/api/register",
        {

            method:
                "POST",

            body: {

                name,
                email,
                password

            }

        }
    );

}


// ============================================================
// CURRENT USER
// ============================================================

async function getCurrentUser() {

    return apiRequest(
        "/api/me",
        {

            method:
                "GET"

        }
    );

}


// ============================================================
// PREMIUM CHECK
// ============================================================

async function checkPremium() {

    return apiRequest(
        "/api/premium-check",
        {

            method:
                "GET"

        }
    );

}


// ============================================================
// LOGOUT
// ============================================================

async function logoutUser() {

    return apiRequest(
        "/api/logout",
        {

            method:
                "POST"

        }
    );

}


// ============================================================
// REDIRECT AFTER LOGIN
// ============================================================

function redirectAfterLogin() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const redirect =
        params.get("redirect");


    // --------------------------------------------------------
    // Kembali ke halaman yang sebelumnya ingin dibuka
    // --------------------------------------------------------

    if (

        redirect &&

        redirect.startsWith("/") &&

        !redirect.startsWith("//")

    ) {

        window.location.href =
            redirect;

        return;

    }


    // --------------------------------------------------------
    // Login normal → kembali ke beranda
    // --------------------------------------------------------

    window.location.href =
        "/index.html";

}


// ============================================================
// CHECK LOGIN PAGE
// ============================================================

async function redirectIfLoggedIn() {

    try {

        const result =
            await getCurrentUser();


        // ----------------------------------------------------
        // Belum login
        // ----------------------------------------------------

        if (

            !result.ok ||

            !result.data.success

        ) {

            return false;

        }


        // ----------------------------------------------------
        // Sudah login
        // Jangan masuk premium.
        // Kembali ke beranda.
        // ----------------------------------------------------

        window.location.href =
            "/index.html";


        return true;


    } catch (error) {

        console.error(
            "AUTH CHECK ERROR:",
            error
        );


        return false;

    }

}


// ============================================================
// REQUIRE LOGIN
//
// Digunakan untuk materi GRATIS.
//
// Contoh:
// candlestick.html
// fibonacci.html
// ema.html
// stochastic.html
//
// User tidak perlu Premium.
// Tetapi WAJIB login.
// ============================================================

async function requireLogin() {

    try {

        const result =
            await getCurrentUser();


        // ----------------------------------------------------
        // Belum login
        // ----------------------------------------------------

        if (

            !result.ok ||

            !result.data.success

        ) {

            const currentPage =
                window.location.pathname +
                window.location.search;


            window.location.href =
                `/login.html?redirect=${encodeURIComponent(
                    currentPage
                )}`;


            return null;

        }


        // ----------------------------------------------------
        // Sudah login
        // ----------------------------------------------------

        return result.data.user;


    } catch (error) {

        console.error(
            "LOGIN AUTH ERROR:",
            error
        );


        const currentPage =
            window.location.pathname +
            window.location.search;


        window.location.href =
            `/login.html?redirect=${encodeURIComponent(
                currentPage
            )}`;


        return null;

    }

}


// ============================================================
// REQUIRE PREMIUM
//
// Digunakan khusus halaman Premium.
//
// Alurnya:
//
// BELUM LOGIN
// ↓
// LOGIN
//
// SUDAH LOGIN
// ↓
//
// BELUM PREMIUM
// ↓
// PREMIUM / PEMBAYARAN
//
// PREMIUM AKTIF
// ↓
// BOLEH MASUK
// ============================================================

async function requirePremium() {

    try {

        const result =
            await checkPremium();


        // ----------------------------------------------------
        // Belum login
        // ----------------------------------------------------

        if (

            !result.ok ||

            !result.data.success

        ) {

            const currentPage =
                window.location.pathname +
                window.location.search;


            window.location.href =
                `/login.html?redirect=${encodeURIComponent(
                    currentPage
                )}`;


            return null;

        }


        // ----------------------------------------------------
        // Sudah login tapi belum Premium
        // ----------------------------------------------------

        if (

            !result.data.premium

        ) {

            window.location.href =
                "/premium.html?access=required";


            return null;

        }


        // ----------------------------------------------------
        // Premium aktif
        // ----------------------------------------------------

        return result.data.user;


    } catch (error) {

        console.error(
            "PREMIUM AUTH ERROR:",
            error
        );


        const currentPage =
            window.location.pathname +
            window.location.search;


        window.location.href =
            `/login.html?redirect=${encodeURIComponent(
                currentPage
            )}`;


        return null;

    }

}


// ============================================================
// UPDATE NAVBAR AUTH
//
// Fungsi ini nanti dipanggil dari index.html dan halaman lain.
//
// BELUM LOGIN:
//
// Login / Register
//
// SUDAH LOGIN:
//
// Nama User
// Logout
// ============================================================

async function updateAuthNavbar() {

    try {

        const result =
            await getCurrentUser();


        const loginRegister =
            document.querySelector(
                "[data-auth-login]"
            );


        const logoutButton =
            document.querySelector(
                "[data-auth-logout]"
            );


        const userName =
            document.querySelector(
                "[data-auth-user]"
            );


        // ----------------------------------------------------
        // BELUM LOGIN
        // ----------------------------------------------------

        if (

            !result.ok ||

            !result.data.success

        ) {

            if (loginRegister) {

                loginRegister.style.display =
                    "";

            }


            if (logoutButton) {

                logoutButton.style.display =
                    "none";

            }


            if (userName) {

                userName.style.display =
                    "none";

            }


            return null;

        }


        // ----------------------------------------------------
        // SUDAH LOGIN
        // ----------------------------------------------------

        const user =
            result.data.user;


        if (loginRegister) {

            loginRegister.style.display =
                "none";

        }


        if (logoutButton) {

            logoutButton.style.display =
                "";

        }


        if (userName) {

            userName.textContent =
                user.name || "User";


            userName.style.display =
                "";

        }


        return user;


    } catch (error) {

        console.error(
            "NAVBAR AUTH ERROR:",
            error
        );


        return null;

    }

}


// ============================================================
// HANDLE LOGOUT
// ============================================================

async function handleLogout() {

    try {

        const result =
            await logoutUser();


        if (

            result.ok &&

            result.data.success

        ) {

            window.location.href =
                "/index.html";


            return true;

        }


        alert(
            result.data.message ||
            "Logout gagal."
        );


        return false;


    } catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );


        alert(
            "Tidak dapat terhubung ke server."
        );


        return false;

    }

}


// ============================================================
// INITIALIZE AUTH NAVBAR
// ============================================================

function initAuthNavbar() {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            updateAuthNavbar();


            const logoutButton =
                document.querySelector(
                    "[data-auth-logout]"
                );


            if (logoutButton) {

                logoutButton.addEventListener(
                    "click",
                    async event => {

                        event.preventDefault();

                        await handleLogout();

                    }
                );

            }

        }
    );

}


// ============================================================
// EXPORT GLOBAL
// ============================================================

window.TradeVestorAuth = {

    apiRequest,

    loginUser,

    registerUser,

    getCurrentUser,

    checkPremium,

    logoutUser,

    redirectAfterLogin,

    redirectIfLoggedIn,

    requireLogin,

    requirePremium,

    updateAuthNavbar,

    handleLogout,

    initAuthNavbar

};
