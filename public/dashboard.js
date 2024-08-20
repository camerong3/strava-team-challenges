const backendUrl = 'https://strava-challenge-backend.vercel.app';  // Replace with your actual Vercel URL

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
    uploadActivities(athlete.id, cachedActivities);  // Upload cached activities to backend
  } else {
    // Fetch new data
    fetchActivities(token).then(activities => {
      uploadActivities(athlete.id, activities);  // Upload new activities to backend
    });
  }

  // Add a button for the user to manually refresh data
  const refreshButton = document.getElementById('refresh-activities');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      console.log('Manual refresh triggered');
      fetchActivities(token).then(activities => {
        uploadActivities(athlete.id, activities);  // Force upload new activities to backend
      });
    });
  } else {
    console.error('Refresh button not found');
  }

  // Handle challenge creation
  const challengeForm = document.getElementById('create-challenge-form');
  if (challengeForm) {
    challengeForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const challengeName = document.getElementById('challenge-name').value;
      const challengeType = document.getElementById('challenge-type').value;
      const challengeMode = document.getElementById('challenge-mode').value;
      const activityType = document.getElementById('activity-type').value;
      const createdBy = athlete.id;

      const response = await fetch(`${backendUrl}/api/challenges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: challengeName,
          type: challengeType,
          mode: challengeMode,
          activityType: activityType,
          createdBy: createdBy
        })
      });

      const data = await response.json();
      console.log('Challenge created with ID:', data.id);
      // Redirect to the challenge dashboard after creating the challenge
      window.location.href = `/challenge-dashboard.html?id=${data.id}`;
    });
  }

  // Handle joining a challenge
  const joinChallengeForm = document.getElementById('join-challenge-form');
  if (joinChallengeForm) {
    joinChallengeForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const challengeId = document.getElementById('challenge-id').value;
      const userId = athlete.id;

      const response = await fetch(`${backendUrl}/api/challenges/${challengeId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
      });

      if (response.ok) {
        console.log('Joined challenge:', challengeId);
        // Redirect to the challenge dashboard after joining
        window.location.href = `/challenge-dashboard.html?id=${challengeId}`;
      } else {
        console.error('Failed to join challenge');
      }
    });
  }

  fetchChallenges();  // Load and display all challenges
});

async function fetchActivities(token) {
  console.log('Fetching new activities from Strava');
  const response = await fetch('https://www.strava.com/api/v3/athlete/activities', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const activities = await response.json();
  // Cache the activities and the time they were fetched
  localStorage.setItem('strava_activities', JSON.stringify(activities));
  localStorage.setItem('strava_activities_cache_time', Date.now());
  displayActivities(activities);
  return activities;
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

async function fetchChallenges() {
  const response = await fetch(`${backendUrl}/api/challenges`);
  const challenges = await response.json();
  displayChallenges(challenges);
}

function displayChallenges(challenges) {
  const challengesList = document.getElementById('challenges-list');
  challengesList.innerHTML = '';

  challenges.forEach(challenge => {
    const listItem = document.createElement('li');
    listItem.textContent = `${challenge.name} - ${challenge.type} (${challenge.mode}) - ${challenge.activityType}`;
    challengesList.appendChild(listItem);
  });
}

async function uploadActivities(userId, activities) {
  await fetch(`${backendUrl}/api/users/${userId}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ activities }),
  });
}

async function displayLeaderboard(challengeId) {
  const response = await fetch(`${backendUrl}/api/challenges/${challengeId}/leaderboard`);
  const data = await response.json();

  const leaderboardContainer = document.getElementById('leaderboard');
  leaderboardContainer.innerHTML = '';  // Clear previous leaderboard

  data.leaderboard.forEach(entry => {
    const listItem = document.createElement('li');
    listItem.textContent = `${entry.participant}: ${(entry.totalDistance / 1000).toFixed(2)} km`;  // Convert meters to kilometers
    leaderboardContainer.appendChild(listItem);
  });
}