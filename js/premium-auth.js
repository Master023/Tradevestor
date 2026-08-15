(async function () {

    try {

        const response = await fetch(
            "/api/me",
            {
                method: "GET",
                credentials: "include"
            }
        );

        const data = await response.json();

        // BELUM LOGIN
        if (!response.ok || !data.success) {

            window.location.href =
                "login.html";

            return;
        }

        const user = data.user;

        // BELUM PREMIUM
        if (
            user.plan !== "premium"
        ) {

            window.location.href =
                "premium.html";

            return;
        }

        // PREMIUM VALID
        console.log(
            "Premium access granted:",
            user.email
        );

        // Kirim data user ke halaman
        window.TRADEVESTOR_USER = user;

        // Event supaya script lain
        // bisa mengetahui user sudah valid
        document.dispatchEvent(
            new CustomEvent(
                "tradevestor-auth-ready",
                {
                    detail: user
                }
            )
        );

    } catch (error) {

        console.error(
            "PREMIUM AUTH ERROR:",
            error
        );

        window.location.href =
            "login.html";

    }

})();
