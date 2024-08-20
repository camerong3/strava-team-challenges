export default async function handler(req, res) {
    const { code } = req.query;
  
    if (!code) {
      return res.status(400).json({ error: 'Missing code parameter' });
    }
  
    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.STRAVA_REDIRECT_URI, // Ensure this matches the root domain
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json({ error: errorData });
      }
  
      const data = await response.json();
  
      // Optionally, you can store the token in a database or session here
  
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to exchange authorization code' });
    }
}
  