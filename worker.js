export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    /*
     * =====================================================
     * API TEST
     * =====================================================
     */

    if (url.pathname === "/api/test") {

      return new Response(
        JSON.stringify({
          success: true,
          message: "TradeVestor API berhasil berjalan."
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

    }


    /*
     * =====================================================
     * STATIC WEBSITE
     * =====================================================
     */

    return env.ASSETS.fetch(request);

  }
};
