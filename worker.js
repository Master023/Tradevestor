export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // =====================================================
    // OPTIONS / CORS
    // =====================================================

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }


    // =====================================================
    // API TEST
    // =====================================================

    if (
      url.pathname === "/api/test" &&
      request.method === "GET"
    ) {

      return json({
        success: true,
        message: "API TradeVestor berhasil berjalan."
      });

    }


    // =====================================================
    // DATABASE TEST
    // =====================================================

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

        console.error("TEST DB ERROR:", error);

        return json({
          success: false,
          database: "error",
          message: error.message
        }, 500);

      }

    }


    // =====================================================
    // REGISTER
    // =====================================================

    if (
      url.pathname === "/api/register" &&
      request.method === "POST"
    ) {

      try {

        const body = await request.json();

        const name =
          String(body.name || "").trim();

        const email =
          String(body.email || "")
            .trim()
            .toLowerCase();

        const password =
          String(body.password || "");


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


        if (!isValidEmail(email)) {

          return json({
            success: false,
            message:
              "Format email tidak valid."
          }, 400);

        }


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


        const passwordHash =
          await hashString(password);


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


        return json({

          success: true,

          message:
            "Akun berhasil dibuat.",

          user: {
            id,
            name,
            email,
            plan: "free",
            premium_expires_at: null
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

          error:
            error.message

        }, 500);

      }

    }


    // =====================================================
    // LOGIN
    // =====================================================

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


        const passwordHash =
          await hashString(password);


        if (
          user.password_hash !== passwordHash
        ) {

          return json({

            success: false,

            message:
              "Email atau password salah."

          }, 401);

        }


        // =================================================
        // CREATE SESSION
        // =================================================

        const sessionToken =
          generateToken();


        const tokenHash =
          await hashString(sessionToken);


        const expiresAt =
          new Date(
            Date.now() +
            7 * 24 * 60 * 60 * 1000
          ).toISOString();


        await env.DB
          .prepare(
            `
            INSERT INTO sessions
            (
              token_hash,
              user_id,
              expires_at
            )
            VALUES
            (?, ?, ?)
            `
          )
          .bind(
            tokenHash,
            user.id,
            expiresAt
          )
          .run();


        const headers =
          new Headers(
            corsHeaders()
          );


        headers.set(
          "Set-Cookie",
          [
            `tv_session=${sessionToken}`,
            "Path=/",
            "HttpOnly",
            "Secure",
            "SameSite=Lax",
            "Max-Age=604800"
          ].join("; ")
        );


        return new Response(

          JSON.stringify({

            success: true,

            message:
              "Login berhasil.",

            user: {

              id:
                user.id,

              name:
                user.name,

              email:
                user.email,

              plan:
                user.plan,

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
            error.message

        }, 500);

      }

    }


    // =====================================================
    // CURRENT USER
    // =====================================================

    if (
      url.pathname === "/api/me" &&
      request.method === "GET"
    ) {

      return getCurrentUser(
        request,
        env
      );

    }


    // =====================================================
    // PREMIUM CHECK
    // =====================================================

    if (
      url.pathname === "/api/premium-check" &&
      request.method === "GET"
    ) {

      try {

        const result =
          await authenticateUser(
            request,
            env
          );


        if (!result.success) {

          return json({

            success: false,

            premium: false,

            message:
              result.message

          }, 401);

        }


        const premium =
          isPremiumActive(
            result.user
          );


        return json({

          success: true,

          premium,

          message:
            premium
              ? "Akses Premium aktif."
              : "Akun belum memiliki akses Premium.",

          user:
            result.user

        });

      } catch (error) {

        console.error(
          "PREMIUM CHECK ERROR:",
          error
        );

        return json({

          success: false,

          premium: false,

          message:
            "Terjadi kesalahan pada server.",

          error:
            error.message

        }, 500);

      }

    }


    // =====================================================
    // ACTIVATE PREMIUM CODE
    // =====================================================

    if (
      url.pathname === "/api/activate-premium" &&
      request.method === "POST"
    ) {

      try {

        // -------------------------------------------------
        // Pastikan user sudah login
        // -------------------------------------------------

        const auth =
          await authenticateUser(
            request,
            env
          );


        if (!auth.success) {

          return json({

            success: false,

            message:
              "Silakan login terlebih dahulu."

          }, 401);

        }


        const user =
          auth.user;


        // -------------------------------------------------
        // Ambil kode
        // -------------------------------------------------

        const body =
          await request.json();


        const code =
          String(body.code || "")
            .trim()
            .toUpperCase();


        if (!code) {

          return json({

            success: false,

            message:
              "Kode Premium wajib diisi."

          }, 400);

        }


        // -------------------------------------------------
        // Cari kode
        // -------------------------------------------------

        const premiumCode =
          await env.DB
            .prepare(
              `
              SELECT
                id,
                code,
                duration_days,
                used,
                used_by,
                used_at
              FROM premium_codes
              WHERE code = ?
              LIMIT 1
              `
            )
            .bind(code)
            .first();


        if (!premiumCode) {

          return json({

            success: false,

            message:
              "Kode Premium tidak ditemukan."

          }, 404);

        }


        // -------------------------------------------------
        // KODE SUDAH DIPAKAI
        // -------------------------------------------------

        if (
          Number(premiumCode.used) === 1
        ) {

          return json({

            success: false,

            message:
              "Kode Premium sudah digunakan."

          }, 409);

        }


        // -------------------------------------------------
        // CEK PREMIUM LAMA
        // -------------------------------------------------

        const now =
          new Date();


        let startDate =
          now;


        if (
          user.premium_expires_at
        ) {

          const oldExpiry =
            new Date(
              user.premium_expires_at
            );


          if (
            !Number.isNaN(
              oldExpiry.getTime()
            ) &&
            oldExpiry > now
          ) {

            startDate =
              oldExpiry;

          }

        }


        // -------------------------------------------------
        // HITUNG EXPIRY
        // -------------------------------------------------

        const durationDays =
          Number(
            premiumCode.duration_days || 30
          );


        const expiryDate =
          new Date(
            startDate.getTime() +
            durationDays *
            24 *
            60 *
            60 *
            1000
          );


        // -------------------------------------------------
        // UPDATE USER + KODE
        // SATU TRANSAKSI
        // -------------------------------------------------

        const updateUser =
          await env.DB
            .prepare(
              `
              UPDATE users
              SET
                plan = 'premium',
                premium_expires_at = ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
              `
            )
            .bind(
              expiryDate.toISOString(),
              user.id
            )
            .run();


        if (
          !updateUser.success
        ) {

          return json({

            success: false,

            message:
              "Gagal mengaktifkan Premium."

          }, 500);

        }


        const markCode =
          await env.DB
            .prepare(
              `
              UPDATE premium_codes
              SET
                used = 1,
                used_by = ?,
                used_at = CURRENT_TIMESTAMP
              WHERE id = ?
                AND used = 0
              `
            )
            .bind(
              user.id,
              premiumCode.id
            )
            .run();


        // -------------------------------------------------
        // Proteksi jika kode ternyata sudah dipakai
        // -------------------------------------------------

        if (
          !markCode.success ||
          Number(markCode.meta?.changes || 0) !== 1
        ) {

          // rollback manual user
          await env.DB
            .prepare(
              `
              UPDATE users
              SET
                plan = 'free',
                premium_expires_at = NULL,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
              `
            )
            .bind(user.id)
            .run();


          return json({

            success: false,

            message:
              "Kode sudah digunakan atau proses aktivasi gagal."

          }, 409);

        }


        // -------------------------------------------------
        // SUKSES
        // -------------------------------------------------

        return json({

          success: true,

          message:
            "Premium berhasil diaktifkan.",

          premium: true,

          user: {

            id:
              user.id,

            name:
              user.name,

            email:
              user.email,

            plan:
              "premium",

            premium_expires_at:
              expiryDate.toISOString()

          }

        });

      } catch (error) {

        console.error(
          "ACTIVATE PREMIUM ERROR:",
          error
        );

        return json({

          success: false,

          message:
            "Terjadi kesalahan saat mengaktifkan Premium.",

          error:
            error.message

        }, 500);

      }

    }


    // =====================================================
    // LOGOUT
    // =====================================================

    if (
      url.pathname === "/api/logout" &&
      request.method === "POST"
    ) {

      try {

        const cookies =
          parseCookies(
            request.headers.get("Cookie")
          );


        const sessionToken =
          cookies.tv_session;


        if (sessionToken) {

          const tokenHash =
            await hashString(
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


        const headers =
          new Headers(
            corsHeaders()
          );


        headers.set(
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
            error.message

        }, 500);

      }

    }


    // =====================================================
    // PROTECT PREMIUM HTML
    // =====================================================

    if (
      request.method === "GET" &&
      isPremiumPage(url.pathname)
    ) {

      const auth =
        await authenticateUser(
          request,
          env
        );


      if (!auth.success) {

        return Response.redirect(
          `${url.origin}/login.html?redirect=${encodeURIComponent(url.pathname)}`,
          302
        );

      }


      if (
        !isPremiumActive(
          auth.user
        )
      ) {

        return Response.redirect(
          `${url.origin}/premium.html?access=required`,
          302
        );

      }

    }


    // =====================================================
    // STATIC ASSETS
    // =====================================================

    if (
      env.ASSETS &&
      typeof env.ASSETS.fetch === "function"
    ) {

      return env.ASSETS.fetch(request);

    }


    // =====================================================
    // 404
    // =====================================================

    return json({

      success: false,

      message:
        "Endpoint tidak ditemukan.",

      path:
        url.pathname

    }, 404);

  }
};


// =========================================================
// PREMIUM PAGE DETECTOR
// =========================================================

function isPremiumPage(pathname) {

  const protectedPages = [

    "/premium-member.html",

    "/premium-market-structure.html",

    "/premium-mtf.html",

    "/premium-risk.html",

    "/premium-psychology.html",

    "/premium-strategy.html",

    "/premium-indicators.html"

  ];


  return protectedPages.includes(
    pathname.toLowerCase()
  );

}


// =========================================================
// AUTHENTICATE USER
// =========================================================

async function authenticateUser(
  request,
  env
) {

  const cookies =
    parseCookies(
      request.headers.get("Cookie")
    );


  const sessionToken =
    cookies.tv_session;


  if (!sessionToken) {

    return {

      success: false,

      message:
        "Belum login."

    };

  }


  const tokenHash =
    await hashString(
      sessionToken
    );


  const session =
    await env.DB
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

    return {

      success: false,

      message:
        "Session tidak valid."

    };

  }


  if (
    new Date(session.expires_at)
    <= new Date()
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


    return {

      success: false,

      message:
        "Session sudah berakhir."

    };

  }


  return {

    success: true,

    user: {

      id:
        session.user_id,

      name:
        session.name,

      email:
        session.email,

      plan:
        session.plan,

      premium_expires_at:
        session.premium_expires_at

    }

  };

}


// =========================================================
// CURRENT USER
// =========================================================

async function getCurrentUser(
  request,
  env
) {

  try {

    const result =
      await authenticateUser(
        request,
        env
      );


    if (!result.success) {

      return json({

        success: false,

        message:
          result.message

      }, 401);

    }


    return json({

      success: true,

      user:
        result.user

    });

  } catch (error) {

    console.error(
      "ME ERROR:",
      error
    );


    return json({

      success: false,

      message:
        "Terjadi kesalahan pada server.",

      error:
        error.message

    }, 500);

  }

}


// =========================================================
// PREMIUM STATUS
// =========================================================

function isPremiumActive(user) {

  if (
    user.plan !== "premium"
  ) {

    return false;

  }


  if (
    !user.premium_expires_at
  ) {

    return true;

  }


  const expiry =
    new Date(
      user.premium_expires_at
    );


  if (
    Number.isNaN(
      expiry.getTime()
    )
  ) {

    return false;

  }


  return expiry > new Date();

}


// =========================================================
// GENERATE TOKEN
// =========================================================

function generateToken() {

  const bytes =
    new Uint8Array(32);


  crypto.getRandomValues(
    bytes
  );


  return Array
    .from(bytes)
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");

}


// =========================================================
// SHA-256
// =========================================================

async function hashString(
  value
) {

  const data =
    new TextEncoder()
      .encode(value);


  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );


  return Array
    .from(
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


// =========================================================
// EMAIL VALIDATION
// =========================================================

function isValidEmail(
  email
) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);

}


// =========================================================
// COOKIE PARSER
// =========================================================

function parseCookies(
  cookieHeader
) {

  const cookies = {};


  if (!cookieHeader) {

    return cookies;

  }


  cookieHeader
    .split(";")
    .forEach(
      cookie => {

        const parts =
          cookie.trim()
            .split("=");


        const key =
          parts.shift();


        const value =
          parts.join("=");


        if (key) {

          cookies[key] =
            value;

        }

      }
    );


  return cookies;

}


// =========================================================
// JSON RESPONSE
// =========================================================

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


// =========================================================
// CORS
// =========================================================

function corsHeaders() {

  return {

    "Content-Type":
      "application/json",

    "Access-Control-Allow-Origin":
      "*",

    "Access-Control-Allow-Headers":
      "Content-Type",

    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS"

  };

}
