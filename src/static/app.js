document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      renderActivities(activities);
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Render activities to the page
  function renderActivities(activities) {
    activitiesList.innerHTML = "";

    // Clear activity select options except placeholder
    // Keep the first placeholder option
    while (activitySelect.options.length > 1) {
      activitySelect.remove(1);
    }

    Object.entries(activities).forEach(([name, details]) => {
      const card = document.createElement("div");
      card.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;
      // Build participants list with delete buttons
      const participantsHtml = details.participants.length === 0
        ? '<li><em>No participants yet</em></li>'
        : details.participants.map(email => `
            <li>
              <div class="participant-row">
                <span class="participant-email">${email}</span>
                <button class="delete-participant" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(email)}" title="Unregister">&times;</button>
              </div>
            </li>
          `).join("");

      card.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <p><strong>Max Participants:</strong> ${details.max_participants}</p>
        <div class="participants-section">
          <h5>Participants</h5>
          <ul class="participants-list">
            ${participantsHtml}
          </ul>
        </div>
      `;
      activitiesList.appendChild(card);

      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });

    // Attach delete button handlers
    document.querySelectorAll('.delete-participant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const activity = decodeURIComponent(btn.dataset.activity);
        const email = decodeURIComponent(btn.dataset.email);

        try {
          const resp = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
            method: 'POST'
          });

          if (!resp.ok) {
            const err = await resp.json();
            messageDiv.textContent = err.detail || 'Failed to unregister participant';
            messageDiv.className = 'error';
            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 5000);
            return;
          }

          const result = await resp.json();
          messageDiv.textContent = result.message;
          messageDiv.className = 'success';
          messageDiv.classList.remove('hidden');
          setTimeout(() => messageDiv.classList.add('hidden'), 3000);

          // Refresh activities
          fetchActivities();
        } catch (err) {
          console.error('Error unregistering participant:', err);
        }
      });
    });
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show new participant immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
