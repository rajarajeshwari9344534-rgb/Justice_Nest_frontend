import BASE_URL from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    fetchProfile();
});

async function fetchProfile() {
    const lawyer_id = localStorage.getItem("user_id");
    if (!lawyer_id) {
        window.location.href = "login.html";
        return;
    }

    const token = localStorage.getItem("access_token");
    try {
        const response = await fetch(`${BASE_URL}/lawyers/${lawyer_id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
            document.getElementById("name").value = data.name;
            document.getElementById("email").value = data.email;
            document.getElementById("phone_number").value = data.phone_number;
            document.getElementById("city").value = data.city;
            document.getElementById("specialization").value = data.specialization;
            document.getElementById("years_of_experience").value = data.years_of_experience;
            document.getElementById("fees_range").value = data.fees_range;
            document.getElementById("current-photo").src = data.photo_url || "https://via.placeholder.com/100";
        } else {
            alert("Failed to fetch profile");
        }
    } catch (e) {
        console.error(e);
    }
}

let isSubmitting = false;

document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerText;

    const lawyer_id = localStorage.getItem("user_id");
    const formData = new FormData(e.target);

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone_number").value.trim();
    const exp = document.getElementById("years_of_experience").value;

    if (!name || /\d/.test(name)) {
        alert("Name cannot be empty and cannot contain numbers!");
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

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.innerText = "Saving Changes...";

    // Remove empty photo if not selected (FormData handles file input automatically, sending empty file object if not selected)
    // Backend expects 'photo' as UploadFile = File(None). If file is empty, it might be an issue?
    // Let's check backend. `photo: Optional[UploadFile] = File(None)`.
    // If I send an empty file, `photo` might not be None but an empty object.
    // Python FastAPI `UploadFile` usually handles empty if optional properly, or I should omit it.
    // In JS FormData, if input type file is empty, it sends a file with name "" and size 0.
    // It's safer to delete it if size is 0, but FormData manipulation is tricky.
    // Let's rely on backend checking or just try.
    // Or I can reconstruct FormData.

    const cleanData = new FormData();
    cleanData.append("name", document.getElementById("name").value);
    cleanData.append("phone_number", document.getElementById("phone_number").value);
    cleanData.append("city", document.getElementById("city").value);
    cleanData.append("specialization", document.getElementById("specialization").value);
    cleanData.append("fees_range", document.getElementById("fees_range").value);
    cleanData.append("years_of_experience", document.getElementById("years_of_experience").value);

    const fileInput = document.querySelector('input[name="photo"]');
    if (fileInput.files.length > 0) {
        cleanData.append("photo", fileInput.files[0]);
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${BASE_URL}/lawyers/${lawyer_id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` },
            body: cleanData
        });
        const res = await response.json();

        if (response.ok) {
            alert("Profile Updated Successfully!");
            location.reload();
        } else {
            alert(res.detail || "Update Failed");
            isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    } catch (e) {
        console.error(e);
        alert("Server Error");
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
    }
});
