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
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(
        `${API_BASE}${endpoint}`,
        config
    );

    let data = {};

    try {

        data = await response.json();

    } catch (error) {

        data = {
            success: false,
            message: "Server mengembalikan response yang tidak valid."
        };

    }

    return {
        ok: response.ok,
        status: response.status,
        data
    };

}


// ============================================================
// LOGIN
// ============================================================

async function loginUser(email, password) {

    return apiRequest(
        "/api/login",
        {
            method: "POST",
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
            method: "POST",
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
            method: "GET"
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
            method: "GET"
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
            method: "POST"
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
    // Jika user sebelumnya mencoba membuka halaman tertentu
    // --------------------------------------------------------

    if (
        redirect &&
        redirect.startsWith("/") &&
        !redirect.startsWith("//")
    ) {

        window.location.href = redirect;

        return;

    }


    // --------------------------------------------------------
    // Setelah login normal
    //
    // Jangan langsung masuk halaman premium.
    // Masuk ke dashboard/home terlebih dahulu.
    // --------------------------------------------------------

    window.location.href = "/index.html";

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
        // Tetap di halaman login/register.
        // ----------------------------------------------------

        if (
            !result.ok ||
            !result.data.success
        ) {

            return false;

        }


        // ----------------------------------------------------
        // Sudah login
        // Arahkan ke halaman utama.
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
// REQUIRE PREMIUM
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

            window.location.href =
                `/login.html?redirect=${encodeURIComponent(
                    window.location.pathname
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


        window.location.href =
            `/login.html?redirect=${encodeURIComponent(
                window.location.pathname
            )}`;

        return null;

    }

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

    requirePremium

};
