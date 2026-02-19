import BASE_URL from "./config.js";
let isSubmitting = false;

async function userSignup(event) {
  event.preventDefault();

  if (isSubmitting) return;

  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerText;

  const fullname = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if (fullname.length < 3) {
    alert("Full name must be at least 3 characters long!");
    return;
  }

  if (/\d/.test(fullname)) {
    alert("Full name cannot contain numbers!");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address!");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters long!");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.innerText = "Creating Account...";

    const response = await fetch(`${BASE_URL}/users/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: fullname,
        email: email,
        password: password
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Store user data and token for auto-login
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("user_email", data.email);
      localStorage.setItem("user_name", data.name);
      localStorage.setItem("user_role", "user");

      alert("Signup successful! Welcome to Justice Nest.");
      window.location.href = "../index.html";
    } else {
      let errorMsg = "Signup failed";
      if (typeof data.detail === "string") {
        errorMsg = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMsg = data.detail.map(err => err.msg).join("\n");
      }
      alert(errorMsg);
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.innerText = originalBtnText;
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred during signup.");
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", userSignup);
  }
});
