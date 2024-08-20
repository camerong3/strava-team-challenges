const clientId = '132666'; // Replace with your Strava client ID
const redirectUri = 'https://strava-team-challenges.vercel.app';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('strava_access_token');
  console.log('Token in localStorage:', token);

  if (token) {
    // User is already logged in, redirect to the dashboard
    console.log('User is already logged in. Redirecting to dashboard...');
    window.location.href = '/dashboard.html';
  } else {
    // No token found, prompt user to log in
    console.log('No token found. Displaying sign-in button.');
    document.getElementById('status-message').textContent = 'Please sign in with Strava to continue.';
    document.getElementById('strava-signin').style.display = 'block';
  }

  document.getElementById('strava-signin').addEventListener('click', () => {
    console.log('Redirecting to Strava for authorization...');
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=activity:read_all`;
  });

  // Handle the redirect after Strava auth
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  console.log('Code from URL:', code);

  if (code) {
    console.log('Authorization code detected. Exchanging for token...');
    fetch(`/api/exchangeToken?code=${code}`)
      .then(response => response.json())
      .then(data => {
        console.log('Received data from token exchange:', data);
        localStorage.setItem('strava_access_token', data.access_token);
        localStorage.setItem('strava_athlete', JSON.stringify(data.athlete));
        window.location.href = '/dashboard.html';
      })
      .catch(error => {
        console.error('Error during token exchange:', error);
        document.getElementById('status-message').textContent = 'Login failed. Please try again.';
      });
  }
});
