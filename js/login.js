import BASE_URL from "./config.js";

let isSubmitting = false;

async function handleLogin(event) {
  event.preventDefault();
  if (isSubmitting) return;

  const form = event.target;
  const role = document.getElementById("role").value;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const submitBtn = form.querySelector("button[type='submit']");

  console.log("Login attempt:", { role, email });

  if (!email || !password) {
    alert("Please enter both email/username and password!");
    return;
  }

  // Basic email format check if it looks like an email (contains @)
  if (email.includes("@") && role !== "admin") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address!");
      return;
    }
  }

  let endpoint = "";
  if (role === "user") {
    endpoint = "/users/login";
  } else if (role === "lawyer") {
    endpoint = "/lawyers/login";
  } else if (role === "admin") {
    endpoint = "/admin/login";
  } else {
    alert("Please select a role");
    return;
  }

  isSubmitting = true;
  const originalBtnText = submitBtn.innerText;
  submitBtn.disabled = true;
  submitBtn.innerText = "Logging in...";

  try {
    const fetchUrl = `${BASE_URL}${endpoint}`;
    console.log("Attempting login to:", fetchUrl);
    console.log("Credentials:", { email, role });

    const response = await fetch(fetchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    console.log("Response status:", response.status);
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { detail: "Server returned non-JSON response" };
      console.error("JSON parse error:", e);
    }
    console.log("Response data:", data);

    if (response.ok) {
      // Store token and user info
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_id", data.user_id || data.lawyer_id); // Handle both ID types
      localStorage.setItem("user_name", data.name);
      localStorage.setItem("user_email", data.email);
      localStorage.setItem("user_role", role); // Store role
      if (data.status) {
        localStorage.setItem("status", data.status);
      }

      alert("Login successful!");

      if (role === "user") {
        window.location.href = "../index.html";
      } else if (role === "lawyer") {
        window.location.href = "home.html";
      } else if (role === "admin") {
        window.location.href = "admin-dashboard.html";
      }

    } else {
      alert(data.detail || "Login failed - Check credentials");
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.innerText = originalBtnText;
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    alert("Connection Error: Could not reach the server at " + BASE_URL + ". If you are testing locally, make sure the backend is running and the URL is correct.");
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
});
