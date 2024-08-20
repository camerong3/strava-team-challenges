const clientId = '132666'; // Replace with your Strava client ID
const redirectUri = 'strava-team-challenges.vercel.app/api/exchangeToken'; // Will be your Vercel URL later

document.getElementById('strava-signin').addEventListener('click', () => {
  window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=activity:read_all`;
});
