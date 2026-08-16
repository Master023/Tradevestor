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
// REDIRECT USER
// ============================================================

function redirectAfterLogin() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const redirect =
        params.get("redirect");

    if (
        redirect &&
        redirect.startsWith("/")
    ) {

        window.location.href = redirect;

        return;

    }

    window.location.href =
        "/premium-member.html";

}


// ============================================================
// CHECK LOGIN PAGE
// ============================================================

async function redirectIfLoggedIn() {

    try {

        const result =
            await getCurrentUser();

        if (
            result.ok &&
            result.data.success
        ) {

            window.location.href =
                "/premium-member.html";

        }

    } catch (error) {

        console.error(
            "AUTH CHECK ERROR:",
            error
        );

    }

}


// ============================================================
// PROTECT FRONTEND PAGE
// ============================================================

async function requirePremium() {

    try {

        const result =
            await checkPremium();

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

        if (
            !result.data.premium
        ) {

            window.location.href =
                "/premium.html?access=required";

            return null;

        }

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
