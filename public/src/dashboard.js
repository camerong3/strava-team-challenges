document.addEventListener('DOMContentLoaded', () => {
    const athlete = JSON.parse(localStorage.getItem('strava_athlete'));
  
    if (athlete) {
      document.getElementById('athlete-name').textContent = `${athlete.firstname} ${athlete.lastname}`;
      document.getElementById('athlete-photo').src = athlete.profile_medium;
      document.getElementById('athlete-city').textContent = athlete.city;
      document.getElementById('athlete-state').textContent = athlete.state;
    } else {
      // Redirect to login if no athlete data is found
      window.location.href = '/';
    }
});
  