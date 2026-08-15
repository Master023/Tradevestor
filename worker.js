export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ==============================
    // CORS / OPTIONS
    // ==============================

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    // ==============================
    // TEST API
    // ==============================

    if (
      url.pathname === "/api/test" &&
      request.method === "GET"
    ) {
      return json({
        success: true,
        message: "API TradeVestor berhasil berjalan."
      });
    }

    // ==============================
    // TEST DATABASE
    // ==============================

    if (
      url.pathname === "/api/test-db" &&
      request.method === "GET"
    ) {
      try {
        const result = await env.DB
          .prepare("SELECT COUNT(*) AS total FROM users")
          .first();

        return json({
          success: true,
          database: "connected",
          users: result?.total || 0
        });

      } catch (error) {
        return json({
          success: false,
          database: "error",
          message: error.message
        }, 500);
      }
    }

    // ==============================
    // REGISTER
    // ==============================

    if (
      url.pathname === "/api/register" &&
      request.method === "POST"
    ) {
      try {
        const body = await request.json();

        const name = String(body.name || "").trim();

        const email = String(body.email || "")
          .trim()
          .toLowerCase();

        const password = String(body.password || "");

        if (!name || !email || !password) {
          return json({
            success: false,
            message:
              "Nama, email, dan password wajib diisi."
          }, 400);
        }

        if (password.length < 8) {
          return json({
            success: false,
            message:
              "Password minimal 8 karakter."
          }, 400);
        }

        if (!email.includes("@")) {
          return json({
            success: false,
            message:
              "Format email tidak valid."
          }, 400);
        }

        const existingUser = await env.DB
          .prepare(
            `
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
            `
          )
          .bind(email)
          .first();

        if (existingUser) {
          return json({
            success: false,
            message:
              "Email sudah terdaftar."
          }, 409);
        }

        const passwordHash =
          await hashPassword(password);

        const result = await env.DB
          .prepare(
            `
            INSERT INTO users
            (
              name,
              email,
              password_hash,
              plan,
              premium_expires_at,
              created_at,
              updated_at
            )
            VALUES
            (
              ?,
              ?,
              ?,
              'free',
              NULL,
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP
            )
            `
          )
          .bind(
            name,
            email,
            passwordHash
          )
          .run();

        const id = result.meta.last_row_id;

        return json({
          success: true,
          message:
            "Akun berhasil dibuat.",
          user: {
            id: id,
            name: name,
            email: email,
            plan: "free"
          }
        });

      } catch (error) {

        console.error(
          "REGISTER ERROR:",
          error
        );

        return json({
          success: false,
          message:
            "Terjadi kesalahan pada server.",
          error: error.message
        }, 500);
      }
    }

    // ==============================
    // LOGIN
    // ==============================

    if (
      url.pathname === "/api/login" &&
      request.method === "POST"
    ) {
      try {

        const body = await request.json();

        const email = String(body.email || "")
          .trim()
          .toLowerCase();

        const password =
          String(body.password || "");

        if (!email || !password) {
          return json({
            success: false,
            message:
              "Email dan password wajib diisi."
          }, 400);
        }

        const user = await env.DB
          .prepare(
            `
            SELECT
              id,
              name,
              email,
              password_hash,
              plan,
              premium_expires_at
            FROM users
            WHERE email = ?
            LIMIT 1
            `
          )
          .bind(email)
          .first();

        if (!user) {
          return json({
            success: false,
            message:
              "Email atau password salah."
          }, 401);
        }

        const passwordHash =
          await hashPassword(password);

        if (
          user.password_hash !== passwordHash
        ) {
          return json({
            success: false,
            message:
              "Email atau password salah."
          }, 401);
        }

        // ==============================
        // BUAT SESSION
        // ==============================

        const sessionToken =
          crypto.randomUUID() +
          "-" +
          crypto.randomUUID();

        const tokenHash =
          await hashPassword(sessionToken);

        const expiresAt =
          new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString();

        await env.DB
          .prepare(
            `
            INSERT INTO sessions
            (
              user_id,
              token_hash,
              expires_at
            )
            VALUES (?, ?, ?)
            `
          )
          .bind(
            user.id,
            tokenHash,
            expiresAt
          )
          .run();

        // ==============================
        // COOKIE SESSION
        // ==============================

        const headers = {
          "Content-Type": "application/json",
          ...corsHeaders(),

          "Set-Cookie":
            `tv_session=${sessionToken}; ` +
            `Path=/; ` +
            `HttpOnly; ` +
            `Secure; ` +
            `SameSite=Lax; ` +
            `Max-Age=604800`
        };

        return new Response(
          JSON.stringify({
            success: true,
            message:
              "Login berhasil.",
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              plan: user.plan,
              premium_expires_at:
                user.premium_expires_at
            }
          }),
          {
            status: 200,
            headers
          }
        );

      } catch (error) {

        console.error(
          "LOGIN ERROR:",
          error
        );

        return json({
          success: false,
          message:
            "Terjadi kesalahan pada server.",
          error: error.message
        }, 500);
      }
    }

    // ==============================
    // CEK SESSION / USER
    // ==============================

    if (
      url.pathname === "/api/me" &&
      request.method === "GET"
    ) {
      try {

        const sessionToken =
          getCookie(
            request,
            "tv_session"
          );

        if (!sessionToken) {
          return json({
            success: false,
            authenticated: false,
            message:
              "Belum login."
          }, 401);
        }

        const tokenHash =
          await hashPassword(sessionToken);

        const session = await env.DB
          .prepare(
            `
            SELECT
              sessions.id,
              sessions.user_id,
              sessions.expires_at,
              users.name,
              users.email,
              users.plan,
              users.premium_expires_at
            FROM sessions
            INNER JOIN users
              ON users.id = sessions.user_id
            WHERE sessions.token_hash = ?
            LIMIT 1
            `
          )
          .bind(tokenHash)
          .first();

        if (!session) {
          return json({
            success: false,
            authenticated: false,
            message:
              "Session tidak valid."
          }, 401);
        }

        if (
          new Date(session.expires_at) <=
          new Date()
        ) {

          await env.DB
            .prepare(
              `
              DELETE FROM sessions
              WHERE id = ?
              `
            )
            .bind(session.id)
            .run();

          return json({
            success: false,
            authenticated: false,
            message:
              "Session sudah kedaluwarsa."
          }, 401);
        }

        return json({
          success: true,
          authenticated: true,
          user: {
            id: session.user_id,
            name: session.name,
            email: session.email,
            plan: session.plan,
            premium_expires_at:
              session.premium_expires_at
          }
        });

      } catch (error) {

        console.error(
          "ME ERROR:",
          error
        );

        return json({
          success: false,
          authenticated: false,
          message:
            "Terjadi kesalahan pada server.",
          error: error.message
        }, 500);
      }
    }

    // ==============================
    // LOGOUT
    // ==============================

    if (
      url.pathname === "/api/logout" &&
      request.method === "POST"
    ) {
      try {

        const sessionToken =
          getCookie(
            request,
            "tv_session"
          );

        if (sessionToken) {

          const tokenHash =
            await hashPassword(
              sessionToken
            );

          await env.DB
            .prepare(
              `
              DELETE FROM sessions
              WHERE token_hash = ?
              `
            )
            .bind(tokenHash)
            .run();
        }

        return new Response(
          JSON.stringify({
            success: true,
            message:
              "Logout berhasil."
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
              ...corsHeaders(),

              "Set-Cookie":
                "tv_session=; " +
                "Path=/; " +
                "HttpOnly; " +
                "Secure; " +
                "SameSite=Lax; " +
                "Max-Age=0"
            }
          }
        );

      } catch (error) {

        return json({
          success: false,
          message:
            "Gagal logout.",
          error: error.message
        }, 500);
      }
    }

    // ==============================
    // 404
    // ==============================

    return json({
      success: false,
      message:
        "Endpoint tidak ditemukan.",
      path: url.pathname
    }, 404);
  }
};


// ==========================================
// HASH PASSWORD
// ==========================================

async function hashPassword(password) {

  const data =
    new TextEncoder().encode(password);

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return Array.from(
    new Uint8Array(hashBuffer)
  )
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}


// ==========================================
// GET COOKIE
// ==========================================

function getCookie(request, name) {

  const cookieHeader =
    request.headers.get("Cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies =
    cookieHeader.split(";");

  for (const cookie of cookies) {

    const [key, ...value] =
      cookie.trim().split("=");

    if (key === name) {

      return value.join("=");

    }
  }

  return null;
}


// ==========================================
// JSON RESPONSE
// ==========================================

function json(data, status = 200) {

  return new Response(
    JSON.stringify(data),
    {
      status: status,
      headers: {
        "Content-Type":
          "application/json",
        ...corsHeaders()
      }
    }
  );
}


// ==========================================
// CORS HEADERS
// ==========================================

function corsHeaders() {

  return {
    "Access-Control-Allow-Origin":
      "https://tradevestor.startingfromzero95.workers.dev",

    "Access-Control-Allow-Headers":
      "Content-Type",

    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS",

    "Access-Control-Allow-Credentials":
      "true"
  };
}
