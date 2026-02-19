import BASE_URL from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    fetchMyComplaints();
});

async function fetchMyComplaints() {
    const user_id = localStorage.getItem("user_id");
    if (!user_id) {
        alert("Please login to view your complaints");
        window.location.href = "../pages/login.html";
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${BASE_URL}/complaints/user/${user_id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const complaints = await response.json();

        const container = document.querySelector(".complaint-container");
        container.innerHTML = "";

        if (complaints.length === 0) {
            container.innerHTML = "<p>No complaints found.</p>";
            return;
        }

        // Global store for this file
        window.userComplaintsMap = complaints;

        complaints.forEach((c, index) => {
            const card = document.createElement("div");
            card.className = "complaint-card card";

            const statusClass = c.status === "resolved" ? "status resolved" : "status pending";
            const statusText = c.status ? c.status.toUpperCase() : "PENDING";

            const createdAt = c.created_at.includes('Z') ? c.created_at : c.created_at.replace(' ', 'T') + 'Z';
            const date = new Date(createdAt);
            const timeStr = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

            card.innerHTML = `
                <div class="card-header">
                    <h3>${c.name} <small>(#${c.id})</small></h3>
                    <span class="${statusClass}">${statusText}</span>
                </div>
                <div class="card-body">
                    <p><strong>City:</strong> ${c.city}</p>
                    <p><strong>State:</strong> ${c.state}</p>
                    <div class="description">${c.complaint_details}</div>
                    
                    ${c.lawyer_name ? `
                    <div class="lawyer-assignment" style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; margin-top: 15px;">
                        <p style="margin: 0; color: #166534; font-weight: 600;">Assigned Lawyer:</p>
                        <p style="margin: 5px 0 0; color: #1e293b;"><strong>Name:</strong> ${c.lawyer_name}</p>
                        <p style="margin: 2px 0 0; color: #1e293b;"><strong>Phone:</strong> ${c.lawyer_phone}</p>
                    </div>
                    ` : ""}

                    <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #f1f5f9;">
                        <span style="font-size: 0.8rem; color: #94a3b8;">${timeStr}</span>
                        <div class="actions" style="display: flex; gap: 8px;">
                            <button class="btn btn-outline" style="padding: 6px 14px; font-size: 0.8rem;" onclick="openEditModal(${index})">Edit</button>
                            <button class="btn" style="padding: 6px 14px; font-size: 0.8rem; background: #fee2e2; color: #ef4444; border: 1px solid #fecaca;" onclick="deleteComplaint(${c.id})">Delete</button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error:", error);
    }
}

async function deleteComplaint(id) {
    if (!confirm("Are you sure you want to delete this complaint? This action cannot be undone.")) return;

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${BASE_URL}/complaints/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            alert("Complaint deleted successfully.");
            fetchMyComplaints();
        } else {
            alert("Failed to delete complaint.");
        }
    } catch (e) {
        console.error(e);
    }
}

function openEditModal(index) {
    const c = window.userComplaintsMap[index];
    if (!c) return;

    const modal = document.getElementById("edit-modal");
    document.getElementById("edit-id").value = c.id;
    document.getElementById("edit-name").value = c.name;
    document.getElementById("edit-city").value = c.city;
    document.getElementById("edit-state").value = c.state;
    document.getElementById("edit-details").value = c.complaint_details;

    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("edit-modal").style.display = "none";
}

async function handleEditSubmit(event) {
    event.preventDefault();
    const id = document.getElementById("edit-id").value;
    const name = document.getElementById("edit-name").value.trim();
    const city = document.getElementById("edit-city").value.trim();
    const state = document.getElementById("edit-state").value.trim();
    const details = document.getElementById("edit-details").value.trim();

    if (!name || /\d/.test(name)) {
        alert("Name cannot contain numbers!");
        return;
    }

    if (!city || !state) {
        alert("City and State are required!");
        return;
    }

    if (details.length < 20) {
        alert("Please provide more details (at least 20 characters) about your complaint.");
        return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("city", city);
    formData.append("state", state);
    formData.append("complaint_details", details);

    const fileInput = document.getElementById("edit-file");
    if (fileInput && fileInput.files[0]) {
        formData.append("file", fileInput.files[0]);
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${BASE_URL}/complaints/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            alert("Complaint updated successfully!");
            closeModal();
            fetchMyComplaints();
        } else {
            alert("Update failed.");
        }
    } catch (e) {
        console.error(e);
    }
}


window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.deleteComplaint = deleteComplaint;
window.handleEditSubmit = handleEditSubmit;

