import BASE_URL from "./config.js";

let isSubmitting = false;

// Handle complaint form submission
document.addEventListener("DOMContentLoaded", function () {
  const complaintForm = document.querySelector("form");
  if (complaintForm && complaintForm.id === "complaint-form") {
    complaintForm.addEventListener("submit", handleComplaintSubmit);
  }
});

async function handleComplaintSubmit(event) {
  event.preventDefault();

  if (isSubmitting) return;

  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerText;

  // Prevent duplicate submissions immediately
  isSubmitting = true;
  submitBtn.disabled = true;
  submitBtn.innerText = "Registering...";

  const user_id = localStorage.getItem("user_id");
  if (!user_id) {
    alert("Please login first to register a complaint");
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
    window.location.href = "../pages/login.html";
    return;
  }

  // Extract values for validation
  const name = document.querySelector('input[name="name"]')?.value || "";
  const number = document.querySelector('input[name="phone"]')?.value || "";
  const city = document.querySelector('input[name="city"]')?.value || "";
  const state = document.querySelector('input[name="state"]')?.value || "";
  const gender = document.querySelector('input[name="gender"]')?.value || "";
  const complaint_details = document.querySelector('textarea[name="complaint_details"]')?.value || "";

  // Validate required fields
  if (!name || !number || !city || !state || !gender || !complaint_details) {
    alert("Please fill all required fields");
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
    return;
  }

  if (!/^\d{10}$/.test(number)) {
    alert("Phone number must be exactly 10 digits!");
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
    return;
  }

  if (complaint_details.length < 20) {
    alert("Please provide more details (at least 20 characters) about your complaint.");
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
    return;
  }

  const formData = new FormData();
  formData.append("user_id", user_id);
  formData.append("name", name);
  formData.append("number", number);
  formData.append("city", city);
  formData.append("state", state);
  formData.append("gender", gender);
  formData.append("complaint_details", complaint_details);

  const fileInput = document.getElementById("complaint_file");
  if (fileInput && fileInput.files[0]) {
    formData.append("file", fileInput.files[0]);
  }

  try {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${BASE_URL}/complaints/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      alert("Complaint registered successfully! Complaint ID: " + data.complaint_id);
      event.target.reset();
      window.location.href = "../pages/list.html";
    } else {
      alert(data.detail || "Failed to register complaint");
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.innerText = originalBtnText;
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while registering complaint");
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
  }
}
