import BASE_URL from "./config.js";

let isSubmitting = false;

function lawyerSignup(event) {
  event.preventDefault();
  if (isSubmitting) return;

  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerText;

  const formData = new FormData(form);

  const name = formData.get("name")?.trim();
  const email = formData.get("email")?.trim();

  if (name && /\d/.test(name)) {
    alert("Name cannot contain numbers!");
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
    return;
  }
  const phone = formData.get("phone_number")?.trim();
  const exp = formData.get("years_of_experience");
  const photo = document.getElementById("photo").files[0];
  const idProof = document.getElementById("id_proof").files[0];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address!");
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    alert("Phone number must be exactly 10 digits!");
    return;
  }

  if (!exp || exp <= 0) {
    alert("Please enter a valid number of years of experience!");
    return;
  }

  if (!photo || !idProof) {
    alert("Both Photo and ID Proof are required for registration!");
    return;
  }

  isSubmitting = true;
  submitBtn.disabled = true;
  submitBtn.innerText = "Registering...";

  fetch(`${BASE_URL}/lawyers/`, {
    method: "POST",
    body: formData
  })
    .then(async (res) => {
      const data = await res.json();

      if (!res.ok) {
        let errorMsg = "Registration failed ❌";
        if (typeof data.detail === "string") {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map(err => err.msg).join("\n");
        }
        alert(errorMsg);
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
        return;
      }

      // Store lawyer data and token for auto-login
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_id", data.lawyer_id);
      localStorage.setItem("user_email", data.email);
      localStorage.setItem("user_name", data.name);
      localStorage.setItem("status", data.status);
      localStorage.setItem("user_role", "lawyer");

      alert("Lawyer registered successfully ✅ Welcome to your dashboard.");
      window.location.href = "../pages/home.html";
    })
    .catch((error) => {
      console.error(error);
      alert("Server error ❌");
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.innerText = originalBtnText;
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const lawyerSignupForm = document.getElementById("lawyerSignupForm");
  if (lawyerSignupForm) {
    lawyerSignupForm.addEventListener("submit", lawyerSignup);
  }
});
