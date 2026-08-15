const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders
  });
}


// =====================================================
// PASSWORD HASH
// =====================================================

async function hashPassword(password) {
  const encoder = new TextEncoder();

  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}


// =====================================================
// PASSWORD CHECK
// =====================================================

async function verifyPassword(password, storedHash) {

  const hash = await hashPassword(password);

  return hash === storedHash;
}


// =====================================================
// UUID
// =====================================================

function createId() {

  return crypto.randomUUID();

}


// =====================================================
// REGISTER
// =====================================================

async function register(request, env) {

  try {

    const body = await request.json();

    const name = String(body.name || "").trim();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");


    // -------------------------
    // VALIDATION
    // -------------------------

    if (!name) {

      return json({
        success: false,
        message: "Nama wajib diisi."
      }, 400);

    }


    if (!email) {

      return json({
        success: false,
        message: "Email wajib diisi."
      }, 400);

    }


    if (!email.includes("@")) {

      return json({
        success: false,
        message: "Format email tidak valid."
      }, 400);

    }


    if (password.length < 8) {

      return json({
        success: false,
        message: "Password minimal 8 karakter."
      }, 400);

    }


    // -------------------------
    // CHECK EMAIL
    // -------------------------

    const existingUser = await env.DB
      .prepare(
        "SELECT id FROM users WHERE email = ?"
      )
      .bind(email)
      .first();


    if (existingUser) {

      return json({
        success: false,
        message: "Email sudah terdaftar."
      }, 409);

    }


    // -------------------------
    // HASH PASSWORD
    // -------------------------

    const passwordHash =
      await hashPassword(password);


    // -------------------------
    // CREATE USER
    // -------------------------

    const id = createId();

    await env.DB
      .prepare(`
        INSERT INTO users
        (
          id,
          name,
          email,
          password_hash,
          plan,
          premium_expires_at,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, 'free', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      .bind(
        id,
        name,
        email,
        passwordHash
      )
      .run();


    return json({

      success: true,

      message:
        "Akun berhasil dibuat.",

      user: {
        id,
        name,
        email,
        plan: "free"
      }

    }, 201);


  } catch (error) {

    console.error(error);

    return json({

      success: false,

      message:
        "Terjadi kesalahan pada server."

    }, 500);

  }

}


// =====================================================
// LOGIN
// =====================================================

async function login(request, env) {

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


    // -------------------------
    // FIND USER
    // -------------------------

    const user = await env.DB
      .prepare(`
        SELECT
          id,
          name,
          email,
          password_hash,
          plan,
          premium_expires_at
        FROM users
        WHERE email = ?
      `)
      .bind(email)
      .first();


    if (!user) {

      return json({
        success: false,
        message:
          "Email atau password salah."
      }, 401);

    }


    // -------------------------
    // VERIFY PASSWORD
    // -------------------------

    const valid =
      await verifyPassword(
        password,
        user.password_hash
      );


    if (!valid) {

      return json({
        success: false,
        message:
          "Email atau password salah."
      }, 401);

    }


    // -------------------------
    // SESSION TOKEN
    // -------------------------

    const sessionToken =
      crypto.randomUUID();


    // Untuk tahap awal kita
    // menggunakan cookie session.

    const cookie =
      `tv_session=${sessionToken}; ` +
      `Path=/; ` +
      `HttpOnly; ` +
      `Secure; ` +
      `SameSite=Lax; ` +
      `Max-Age=2592000`;


    // -------------------------
    // RESPONSE
    // -------------------------

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

        headers: {

          "Content-Type":
            "application/json",

          "Cache-Control":
            "no-store",

          "Set-Cookie":
            cookie

        }

      }

    );


  } catch (error) {

    console.error(error);

    return json({

      success: false,

      message:
        "Terjadi kesalahan pada server."

    }, 500);

  }

}


// =====================================================
// API TEST
// =====================================================

async function apiTest() {

  return json({

    success: true,

    message:
      "TradeVestor API berhasil berjalan."

  });

}


// =====================================================
// WORKER
// =====================================================

export default {

  async fetch(request, env) {

    const url =
      new URL(request.url);


    // -------------------------
    // API TEST
    // -------------------------

    if (
      request.method === "GET" &&
      url.pathname === "/api/test"
    ) {

      return apiTest();

    }


    // -------------------------
    // REGISTER
    // -------------------------

    if (
      request.method === "POST" &&
      url.pathname === "/api/register"
    ) {

      return register(
        request,
        env
      );

    }


    // -------------------------
    // LOGIN
    // -------------------------

    if (
      request.method === "POST" &&
      url.pathname === "/api/login"
    ) {

      return login(
        request,
        env
      );

    }


    // -------------------------
    // WEBSITE
    // -------------------------

    return env.ASSETS.fetch(request);

  }

};
