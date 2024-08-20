const clientId = '132666'; // Replace with your Strava client ID
const redirectUri = 'https://strava-team-challenges.vercel.app';

document.getElementById('strava-signin').addEventListener('click', () => {
  window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=activity:read_all`;
});

// Handle the redirect after Strava auth
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
  // Redirect to your API endpoint with the code
  window.location.href = `/api/exchangeToken?code=${code}`;
}
