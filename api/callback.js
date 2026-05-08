export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "No authorization code provided" });
  }

  try {
    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(400).json({ error: "Token exchange failed", details: data });
    }

    // Redirect to frontend with tokens in URL fragment (never logged by servers)
    const params = new URLSearchParams({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      athlete_id: data.athlete?.id,
      athlete_name: `${data.athlete?.firstname} ${data.athlete?.lastname}`,
    });

    res.redirect(`/?${params.toString()}`);
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
}
