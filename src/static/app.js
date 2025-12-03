document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // Prevent cached responses by adding a timestamp and forcing no-store
      const response = await fetch(`/activities?_=${Date.now()}`, { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section (pretty bulleted list)
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsTitle = document.createElement("p");
        participantsTitle.innerHTML = "<strong>Participants:</strong>";
        participantsSection.appendChild(participantsTitle);

        const ul = document.createElement("ul");
        ul.className = "participants-list";

        if (!details.participants || details.participants.length === 0) {
          const li = document.createElement("li");
          li.className = "participant-item empty";
          li.textContent = "No participants yet";
          ul.appendChild(li);
        } else {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = p;

            const delBtn = document.createElement("button");
            delBtn.className = "participant-delete";
            delBtn.setAttribute("aria-label", `Remove ${p} from ${name}`);
            delBtn.title = "Remove participant";
            delBtn.innerHTML = "&times;";

            // Click handler to remove participant
            delBtn.addEventListener("click", async () => {
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );

                const data = await resp.json();
                if (resp.ok) {
                  messageDiv.textContent = data.message;
                  messageDiv.className = "success";
                  messageDiv.classList.remove("hidden");
                  // Refresh the activities list to reflect the change
                  fetchActivities();
                } else {
                  messageDiv.textContent = data.detail || "Could not remove participant";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                }

                setTimeout(() => messageDiv.classList.add("hidden"), 4000);
              } catch (err) {
                console.error("Error removing participant:", err);
                messageDiv.textContent = "Failed to remove participant. Please try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 4000);
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(delBtn);
            ul.appendChild(li);
          });
        }

        participantsSection.appendChild(ul);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown (avoid duplicates)
        const exists = Array.from(activitySelect.options).some(
          (o) => o.value === name
        );
        if (!exists) {
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          activitySelect.appendChild(option);
        }
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
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
        // Refresh activity list to show new participant immediately
        await fetchActivities();
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
