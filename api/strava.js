export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });

  const token = authHeader.replace("Bearer ", "");
  const { action, refresh_token, before, after, per_page = 30, page = 1, id } = req.query;

  try {
    // ── Refresh token ─────────────────────────────────────────────────────
    if (action === "refresh") {
      const r = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token,
        }),
      });
      return res.status(200).json(await r.json());
    }

    // ── Single activity detail ────────────────────────────────────────────
    if (action === "detail" && id) {
      const r = await fetch(`https://www.strava.com/api/v3/activities/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.status(200).json(await r.json());
    }

    // ── Activities list ───────────────────────────────────────────────────
    const params = new URLSearchParams({ per_page, page });
    if (before) params.set("before", before);
    if (after) params.set("after", after);

    const r = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
