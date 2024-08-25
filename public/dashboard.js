const backendUrl = 'https://strava-challenge-backend.vercel.app';  // Replace with your actual Vercel URL

document.addEventListener('DOMContentLoaded', () => {
  const athlete = JSON.parse(localStorage.getItem('strava_athlete'));
  const token = localStorage.getItem('strava_access_token');
  const cacheTime = localStorage.getItem('strava_activities_cache_time');
  const cacheDuration = 1000 * 60 * 60 * 24; // Cache for 24 hours

  if (!window.location.pathname.includes('challenge-dashboard.html')) {
    if (athlete) {
      document.getElementById('athlete-name').textContent = `${athlete.firstname} ${athlete.lastname}`;
      document.getElementById('athlete-photo').src = athlete.profile;
      document.getElementById('athlete-city').textContent = athlete.city;
      document.getElementById('athlete-state').textContent = athlete.state;

      // Fetch and display user groups
      fetchAndDisplayUserGroups(athlete.id);
    } else {
      // Redirect to login if no athlete data is found
      window.location.href = '/';
    }
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
    console.warn('Refresh button not found');
  }

// Handle challenge creation
const challengeForm = document.getElementById('create-challenge-form');
if (challengeForm) {
  challengeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const challengeName = document.getElementById('challenge-name').value;
    const challengeType = document.getElementById('challenge-type').value;
    const challengeMode = document.getElementById('challenge-mode').value;
    const createdBy = athlete.id;
    const firstname = athlete.firstname; // Retrieve first name
    const lastname = athlete.lastname;   // Retrieve last name
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    // Collect all selected activity types from the checkboxes
    const activityTypeCheckboxes = document.querySelectorAll('input[name="activity-type"]:checked');
    const activityTypes = Array.from(activityTypeCheckboxes).map(checkbox => checkbox.value);

    // After successfully creating a challenge
    const response = await fetch(`${backendUrl}/api/challenges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: challengeName,
        type: challengeType,
        mode: challengeMode,
        activityTypes: activityTypes,  // Pass the selected activity types as an array
        createdBy: createdBy,
        firstname: firstname,
        lastname: lastname,
        startDate: startDate,
        endDate: endDate
      })
    });

    const data = await response.json();
    console.log('Challenge created with ID:', data.id);

    // Store the challenge ID in localStorage
    localStorage.setItem('challengeId', data.id);

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
      const firstname = athlete.firstname; // Retrieve first name
      const lastname = athlete.lastname;   // Retrieve last name

      const response = await fetch(`${backendUrl}/api/challenges/${challengeId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId, firstname: firstname, lastname: lastname })
      });

      if (response.ok) {
        console.log('Joined challenge:', challengeId);
        // Refresh the user's groups after joining a challenge
        fetchAndDisplayUserGroups(userId);
        // Redirect to the challenge dashboard after joining
        window.location.href = `/challenge-dashboard.html?id=${challengeId}`;
      } else {
        console.error('Failed to join challenge');
      }
    });
  }

  // Log out button handler
  const logoutButton = document.getElementById('logout-button');
  logoutButton.addEventListener('click', () => {
    // Clear Strava-related localStorage items
    localStorage.removeItem('strava_athlete');
    localStorage.removeItem('strava_access_token');
    localStorage.removeItem('strava_activities_cache_time');
    localStorage.removeItem('strava_activities');
    
    // Redirect to the homepage or login page
    window.location.href = '/index.html';
  });
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
  
  if (activitiesList) {  // Check if the element exists
    activitiesList.innerHTML = '';

    activities.forEach(activity => {
      const distanceInMiles = (activity.distance / 1609.34).toFixed(2); // Convert meters to miles and round to 2 decimal places
      
      // Create a list item
      const listItem = document.createElement('li');

      // Create an anchor tag to link to the activity on Strava
      const activityLink = document.createElement('a');
      activityLink.href = `https://www.strava.com/activities/${activity.id}`;
      activityLink.textContent = `${activity.name} - ${distanceInMiles} miles`;
      activityLink.target = '_blank'; // Open in a new tab

      // Append the anchor tag to the list item
      listItem.appendChild(activityLink);

      // Append the list item to the activities list
      activitiesList.appendChild(listItem);
    });
  } else {
    console.warn('Element with id "activities-list" not found on this page.');
  }
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
  try {
    const response = await fetch(`${backendUrl}/api/challenges/${challengeId}/leaderboard`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    const leaderboardContainer = document.getElementById('leaderboard');

    if (!leaderboardContainer) {
      throw new Error("Element with ID 'leaderboard' not found in the DOM");
    }

    leaderboardContainer.innerHTML = '';  // Clear previous leaderboard

    if (data.leaderboard.length === 0) {
      leaderboardContainer.textContent = 'No leaderboard data available.';
    } else {
      data.leaderboard.forEach(entry => {
        const distanceInMiles = (entry.totalDistance / 1609.34).toFixed(2); // Convert meters to miles and round to 2 decimal places
        
        // Create a list item for the leaderboard entry
        const listItem = document.createElement('li');
        listItem.classList.add('leaderboard-item');  // Add a class for styling
        
        // Create a clickable span for the participant's name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${entry.firstname} ${entry.lastname}: ${distanceInMiles} miles`;
        nameSpan.style.cursor = 'pointer';
        nameSpan.classList.add('leaderboard-name');  // Add a class for styling

        // Toggle the visibility of the activity list on click
        nameSpan.addEventListener('click', () => {
          const activitiesList = listItem.querySelector('.activities-list');
          activitiesList.style.display = activitiesList.style.display === 'none' ? 'block' : 'none';
        });

        // Append the name span to the list item
        listItem.appendChild(nameSpan);

        // Create a hidden list for the activities
        const activitiesList = document.createElement('ul');
        activitiesList.classList.add('activities-list');
        activitiesList.style.display = 'none'; // Initially hidden

        entry.activities.forEach(activity => {
          const activityItem = document.createElement('li');
          activityItem.classList.add('activity-item');  // Add a class for styling

          const activityLink = document.createElement('a');
          activityLink.href = `https://www.strava.com/activities/${activity.id}`;
          activityLink.textContent = `${activity.name} - ${(activity.distance / 1609.34).toFixed(2)} miles (${new Date(activity.start_date_local).toLocaleDateString()})`;
          activityLink.target = '_blank';

          activityItem.appendChild(activityLink);
          activitiesList.appendChild(activityItem);
        });

        // Append the activities list to the list item
        listItem.appendChild(activitiesList);

        // Append the list item to the leaderboard container
        leaderboardContainer.appendChild(listItem);
      });
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
  }
}

async function fetchAndDisplayUserGroups(userId) {
  try {
    const response = await fetch(`${backendUrl}/api/users/${userId}/groups`);
    const data = await response.json();

    const groupsList = document.getElementById('user-groups-list');
    groupsList.innerHTML = ''; // Clear the list first

    if (data.groups.length === 0) {
      groupsList.textContent = 'You are not participating in any groups.';
    } else {
      for (const groupId of data.groups) {
        const groupResponse = await fetch(`${backendUrl}/api/challenges/${groupId}`);
        const groupData = await groupResponse.json();

        const listItem = document.createElement('li');
        listItem.innerHTML = `<a href="/challenge-dashboard.html?id=${groupId}">${groupData.name}</a>`;
        groupsList.appendChild(listItem);
      }
    }
  } catch (error) {
    console.error('Error fetching user groups:', error);
  }
}

// Scroll event handling for header
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.header');
  const profilePhoto = document.querySelector('.profile-photo');
  const profileDetails = document.querySelector('.profile-details');

  const initialHeight = header.offsetHeight;
  const minHeight = 60; // The height after it shrinks completely

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    if (scrollY < initialHeight - minHeight) {
      const scale = 1 - (scrollY / (initialHeight - minHeight));
      header.style.height = `${initialHeight - scrollY}px`;
      profilePhoto.style.transform = `scale(${Math.max(scale, 0.4)})`;
      profileDetails.style.transform = `translateY(${-10 * (1 - scale)}px)`;
      profileDetails.style.opacity = scale;
    } else {
      header.classList.add('scrolled');
    }
  });
});
