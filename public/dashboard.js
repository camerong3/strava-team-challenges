document.addEventListener('DOMContentLoaded', () => {
  const athlete = JSON.parse(localStorage.getItem('strava_athlete'));
  const token = localStorage.getItem('strava_access_token');
  const cacheTime = localStorage.getItem('strava_activities_cache_time');
  const cacheDuration = 1000 * 60 * 60 * 24; // Cache for 24 hours

  if (athlete) {
    document.getElementById('athlete-name').textContent = `${athlete.firstname} ${athlete.lastname}`;
    document.getElementById('athlete-photo').src = athlete.profile_medium;
    document.getElementById('athlete-city').textContent = athlete.city;
    document.getElementById('athlete-state').textContent = athlete.state;
  } else {
    // Redirect to login if no athlete data is found
    window.location.href = '/';
  }

  if (cacheTime && (Date.now() - cacheTime < cacheDuration)) {
    // Use cached data
    console.log('Using cached activities');
    const cachedActivities = JSON.parse(localStorage.getItem('strava_activities'));
    displayActivities(cachedActivities);
  } else {
    // Fetch new data
    console.log('Fetching new activities from Strava');
    fetchActivities(token);
  }

  // Add a button for the user to manually refresh data
  document.getElementById('refresh-activities').addEventListener('click', () => {
    fetchActivities(token, true); // Force fetch new data
  });
});

function fetchActivities(token, force = false) {
  if (!force) {
    // Check cache before fetching
    const cacheTime = localStorage.getItem('strava_activities_cache_time');
    const cacheDuration = 1000 * 60 * 60 * 24; // Cache for 24 hours
    if (cacheTime && (Date.now() - cacheTime < cacheDuration)) {
      const cachedActivities = JSON.parse(localStorage.getItem('strava_activities'));
      displayActivities(cachedActivities);
      return;
    }
  }

  fetch('https://www.strava.com/api/v3/athlete/activities', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => response.json())
  .then(activities => {
    // Cache the activities and the time they were fetched
    localStorage.setItem('strava_activities', JSON.stringify(activities));
    localStorage.setItem('strava_activities_cache_time', Date.now());
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
    const distanceInMiles = (activity.distance / 1609.34).toFixed(2); // Convert meters to miles and round to 2 decimal places
    const listItem = document.createElement('li');
    listItem.textContent = `${activity.name} - ${distanceInMiles} miles`;
    activitiesList.appendChild(listItem);
  });
}
