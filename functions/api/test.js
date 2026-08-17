export async function onRequest() {
    return new Response(
        JSON.stringify({
            success: true,
            message: "TradeVestor API aktif"
        }),
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}
