document.addEventListener('DOMContentLoaded', () => {
  const athlete = JSON.parse(localStorage.getItem('strava_athlete'));
  const token = localStorage.getItem('strava_access_token');

  if (athlete) {
    document.getElementById('athlete-name').textContent = `${athlete.firstname} ${athlete.lastname}`;
    document.getElementById('athlete-photo').src = athlete.profile_medium;
    document.getElementById('athlete-city').textContent = athlete.city;
    document.getElementById('athlete-state').textContent = athlete.state;
  } else {
    // Redirect to login if no athlete data is found
    window.location.href = '/';
  }

  if (token) {
    fetch('https://www.strava.com/api/v3/athlete/activities', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(activities => {
      const activitiesList = document.getElementById('activities-list');
      activities.forEach(activity => {
        const listItem = document.createElement('li');
        listItem.textContent = `${activity.name} - ${activity.distance / 1000} km`;
        activitiesList.appendChild(listItem);
      });
    })
    .catch(error => {
      console.error('Error fetching activities:', error);
    });
  }
});