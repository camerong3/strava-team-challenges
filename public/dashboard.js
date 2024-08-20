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

  // Check if activities are already cached
  const cachedActivities = JSON.parse(localStorage.getItem('strava_activities'));
  const cacheTime = localStorage.getItem('strava_activities_cache_time');
  const cacheDuration = 1000 * 60 * 5; // Cache for 5 minutes

  if (cachedActivities && cacheTime && (Date.now() - cacheTime < cacheDuration)) {
    console.log('Using cached activities');
    displayActivities(cachedActivities);
  } else {
    console.log('Fetching new activities from Strava');
    fetchActivities(token);
  }
});

function fetchActivities(token) {
  const lastFetchTime = localStorage.getItem('strava_activities_last_fetch_time');
  
  fetch('https://www.strava.com/api/v3/athlete/activities', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'If-Modified-Since': lastFetchTime ? new Date(lastFetchTime).toUTCString() : ''
    }
  })
  .then(response => {
    if (response.status === 304) {
      // Not modified, use cached data
      console.log('Activities not modified, using cached data');
      return JSON.parse(localStorage.getItem('strava_activities'));
    } else {
      // Update cache with new data
      return response.json().then(activities => {
        localStorage.setItem('strava_activities', JSON.stringify(activities));
        localStorage.setItem('strava_activities_last_fetch_time', new Date().toISOString());
        return activities;
      });
    }
  })
  .then(activities => {
    displayActivities(activities);
  })
  .catch(error => {
    console.error('Error fetching activities:', error);
  });
}

function displayActivities(activities) {
  const activitiesList = document.getElementById('activities-list');
  activitiesList.innerHTML = '';

  activities.forEach(activity => {
    const listItem = document.createElement('li');
    listItem.textContent = `${activity.name} - ${activity.distance / 1000} km`;
    activitiesList.appendChild(listItem);
  });
}
