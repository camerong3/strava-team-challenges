const clientId = '132666'; // Replace with your Strava client ID
const redirectUri = 'https://strava-team-challenges.vercel.app';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('strava_access_token');

  if (token) {
    // User is already logged in, redirect to the dashboard
    window.location.href = '/dashboard.html';
  } else {
    // No token found, prompt user to log in
    document.getElementById('status-message').textContent = 'Please sign in with Strava to continue.';
    document.getElementById('strava-signin').style.display = 'block';
  }

  document.getElementById('strava-signin').addEventListener('click', () => {
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=activity:read_all`;
  });

  // Handle the redirect after Strava auth
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    fetch(`/api/exchangeToken?code=${code}`)
      .then(response => response.json())
      .then(data => {
        localStorage.setItem('strava_access_token', data.access_token);
        localStorage.setItem('strava_athlete', JSON.stringify(data.athlete));
        window.location.href = '/dashboard.html';
      })
      .catch(error => {
        console.error('Error:', error);
        document.getElementById('status-message').textContent = 'Login failed. Please try again.';
      });
  }
});
