export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ==========================================
    // CORS / OPTIONS
    // ==========================================

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    // ==========================================
    // TEST API
    // ==========================================

    if (
      url.pathname === "/api/test" &&
      request.method === "GET"
    ) {
      return json({
        success: true,
        message: "API TradeVestor berhasil berjalan."
      });
    }

    // ==========================================
    // TEST DATABASE
    // ==========================================

    if (
      url.pathname === "/api/test-db" &&
      request.method === "GET"
    ) {
      try {
        const result = await env.DB
          .prepare(
            "SELECT COUNT(*) AS total FROM users"
          )
          .first();

        return json({
          success: true,
          database: "connected",
          users: Number(result?.total || 0)
        });

      } catch (error) {
        console.error("DATABASE ERROR:", error);

        return json({
          success: false,
          database: "error",
          message: error.message
        }, 500);
      }
    }

    // ==========================================
    // REGISTER
    // ==========================================

    if (
      url.pathname === "/api/register" &&
      request.method === "POST"
    ) {
      try {
        const body = await request.json();

        const name = String(
          body.name || ""
        ).trim();

        const email = String(
          body.email || ""
        )
          .trim()
          .toLowerCase();

        const password = String(
          body.password || ""
        );

        // --------------------------------------
        // VALIDASI
        // --------------------------------------

        if (!name || !email || !password) {
          return json({
            success: false,
            message:
              "Nama, email, dan password wajib diisi."
          }, 400);
        }

        if (name.length < 2) {
          return json({
            success: false,
            message:
              "Nama minimal 2 karakter."
          }, 400);
        }

        if (password.length < 8) {
          return json({
            success: false,
            message:
              "Password minimal 8 karakter."
          }, 400);
        }

        const emailRegex =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
          return json({
            success: false,
            message:
              "Format email tidak valid."
          }, 400);
        }

        // --------------------------------------
        // CEK EMAIL
        // --------------------------------------

        const existingUser =
          await env.DB
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

        // --------------------------------------
        // HASH PASSWORD
        // --------------------------------------

        const passwordHash =
          await hashPassword(password);

        // --------------------------------------
        // CREATE USER
        // --------------------------------------

        const result =
          await env.DB
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

        const id =
          result.meta.last_row_id;

        // --------------------------------------
        // RESPONSE
        // --------------------------------------

        return json({
          success: true,
          message:
            "Akun berhasil dibuat.",
          user: {
            id: Number(id),
            name: name,
            email: email,
            plan: "free"
          }
        }, 201);

      } catch (error) {
        console.error(
          "REGISTER ERROR:",
          error
        );

        return json({
          success: false,
          message:
            "Terjadi kesalahan pada server.",
          error:
            error?.message ||
            "Unknown error"
        }, 500);
      }
    }

    // ==========================================
    // LOGIN
    // ==========================================

    if (
      url.pathname === "/api/login" &&
      request.method === "POST"
    ) {
      try {
        const body =
          await request.json();

        const email =
          String(body.email || "")
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

        // --------------------------------------
        // FIND USER
        // --------------------------------------

        const user =
          await env.DB
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

        // --------------------------------------
        // CHECK PASSWORD
        // --------------------------------------

        const passwordHash =
          await hashPassword(password);

        if (
          user.password_hash !==
          passwordHash
        ) {
          return json({
            success: false,
            message:
              "Email atau password salah."
          }, 401);
        }

        // --------------------------------------
        // CREATE SESSION
        // --------------------------------------

        const sessionToken =
          generateToken();

        const tokenHash =
          await hashToken(sessionToken);

        const expiresAt =
          new Date(
            Date.now() +
            1000 * 60 * 60 * 24 * 30
          ).toISOString();

        // Hapus session lama user
        await env.DB
          .prepare(
            `
            DELETE FROM sessions
            WHERE user_id = ?
            `
          )
          .bind(user.id)
          .run();

        // Simpan session baru
        await env.DB
          .prepare(
            `
            INSERT INTO sessions
            (
              user_id,
              token_hash,
              expires_at,
              created_at
            )
            VALUES
            (
              ?,
              ?,
              ?,
              CURRENT_TIMESTAMP
            )
            `
          )
          .bind(
            user.id,
            tokenHash,
            expiresAt
          )
          .run();

        // --------------------------------------
        // COOKIE
        // --------------------------------------

        const headers = new Headers();

        headers.set(
          "Content-Type",
          "application/json"
        );

        headers.set(
          "Access-Control-Allow-Origin",
          new URL(request.url).origin
        );

        headers.set(
          "Access-Control-Allow-Headers",
          "Content-Type"
        );

        headers.set(
          "Access-Control-Allow-Methods",
          "GET, POST, OPTIONS"
        );

        headers.append(
          "Set-Cookie",
          [
            `tv_session=${sessionToken}`,
            "Path=/",
            "HttpOnly",
            "Secure",
            "SameSite=Lax",
            `Max-Age=${60 * 60 * 24 * 30}`
          ].join("; ")
        );

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
          error:
            error?.message ||
            "Unknown error"
        }, 500);
      }
    }

    // ==========================================
    // CURRENT USER
    // ==========================================

    if (
      url.pathname === "/api/user" &&
      request.method === "GET"
    ) {
      try {
        const session =
          await getSession(
            request,
            env
          );

        if (!session) {
          return json({
            success: false,
            authenticated: false,
            message:
              "Belum login."
          }, 401);
        }

        const user =
          await env.DB
            .prepare(
              `
              SELECT
                id,
                name,
                email,
                plan,
                premium_expires_at
              FROM users
              WHERE id = ?
              LIMIT 1
              `
            )
            .bind(session.user_id)
            .first();

        if (!user) {
          return json({
            success: false,
            authenticated: false,
            message:
              "User tidak ditemukan."
          }, 401);
        }

        // --------------------------------------
        // CHECK PREMIUM
        // --------------------------------------

        const premiumActive =
          isPremiumActive(user);

        return json({
          success: true,
          authenticated: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            plan: user.plan,
            premium_expires_at:
              user.premium_expires_at,
            premium_active:
              premiumActive
          }
        });

      } catch (error) {
        console.error(
          "USER ERROR:",
          error
        );

        return json({
          success: false,
          message:
            "Terjadi kesalahan pada server.",
          error:
            error?.message ||
            "Unknown error"
        }, 500);
      }
    }

    // ==========================================
    // LOGOUT
    // ==========================================

    if (
      url.pathname === "/api/logout" &&
      request.method === "POST"
    ) {
      try {
        const session =
          await getSession(
            request,
            env
          );

        if (session) {
          await env.DB
            .prepare(
              `
              DELETE FROM sessions
              WHERE token_hash = ?
              `
            )
            .bind(
              session.token_hash
            )
            .run();
        }

        const headers = new Headers();

        headers.set(
          "Content-Type",
          "application/json"
        );

        headers.set(
          "Access-Control-Allow-Origin",
          new URL(request.url).origin
        );

        headers.set(
          "Access-Control-Allow-Headers",
          "Content-Type"
        );

        headers.set(
          "Access-Control-Allow-Methods",
          "GET, POST, OPTIONS"
        );

        headers.append(
          "Set-Cookie",
          [
            "tv_session=",
            "Path=/",
            "HttpOnly",
            "Secure",
            "SameSite=Lax",
            "Max-Age=0"
          ].join("; ")
        );

        return new Response(
          JSON.stringify({
            success: true,
            message:
              "Logout berhasil."
          }),
          {
            status: 200,
            headers
          }
        );

      } catch (error) {
        console.error(
          "LOGOUT ERROR:",
          error
        );

        return json({
          success: false,
          message:
            "Terjadi kesalahan pada server.",
          error:
            error?.message ||
            "Unknown error"
        }, 500);
      }
    }

    // ==========================================
    // 404
    // ==========================================

    return json({
      success: false,
      message:
        "Endpoint tidak ditemukan.",
      path:
        url.pathname
    }, 404);
  }
};


// ==========================================
// HASH PASSWORD
// ==========================================

async function hashPassword(password) {
  const data =
    new TextEncoder()
      .encode(password);

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
// GENERATE SESSION TOKEN
// ==========================================

function generateToken() {
  const bytes =
    new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}


// ==========================================
// HASH SESSION TOKEN
// ==========================================

async function hashToken(token) {
  const data =
    new TextEncoder()
      .encode(token);

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
// GET SESSION
// ==========================================

async function getSession(
  request,
  env
) {
  const cookie =
    request.headers.get("Cookie") || "";

  const match =
    cookie.match(
      /(?:^|;\s*)tv_session=([^;]+)/
    );

  if (!match) {
    return null;
  }

  const sessionToken =
    match[1];

  const tokenHash =
    await hashToken(sessionToken);

  const session =
    await env.DB
      .prepare(
        `
        SELECT
          id,
          user_id,
          token_hash,
          expires_at
        FROM sessions
        WHERE token_hash = ?
        LIMIT 1
        `
      )
      .bind(tokenHash)
      .first();

  if (!session) {
    return null;
  }

  if (
    new Date(session.expires_at)
      .getTime() <= Date.now()
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

    return null;
  }

  return session;
}


// ==========================================
// PREMIUM CHECK
// ==========================================

function isPremiumActive(user) {
  if (user.plan !== "premium") {
    return false;
  }

  if (!user.premium_expires_at) {
    return true;
  }

  return (
    new Date(
      user.premium_expires_at
    ).getTime() > Date.now()
  );
}


// ==========================================
// JSON RESPONSE
// ==========================================

function json(
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",
        ...corsHeaders()
      }
    }
  );
}


// ==========================================
// CORS
// ==========================================

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin":
      "*",

    "Access-Control-Allow-Headers":
      "Content-Type",

    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS"
  };
}
