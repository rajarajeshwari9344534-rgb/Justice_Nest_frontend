import BASE_URL from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    fetchPendingComplaints();
    fetchMyCases();
});

function checkAuth() {
    const role = localStorage.getItem("user_role");
    const status = localStorage.getItem("status");

    if (role !== "lawyer") {
        window.location.href = "../pages/login.html";
        return;
    }

    if (status === "pending") {
        const warning = document.createElement("div");
        warning.className = "status-warning";
        warning.innerHTML = `
            <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ffeeba; display: flex; align-items: center; gap: 10px;">
                <span>⚠️</span>
                <div>
                    <strong>Action Required:</strong> Your account is currently pending admin approval. 
                    You can view complaints, but you will not be able to accept cases until verified.
                </div>
            </div>
        `;
        const dashboardGrid = document.querySelector(".dashboard-grid");
        if (dashboardGrid) {
            dashboardGrid.prepend(warning);
        }
    }
}

async function fetchPendingComplaints() {
    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${BASE_URL}/complaints/pending`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const complaints = await response.json();
        renderComplaints(complaints, "pending-container", true);
    } catch (e) { console.error(e); }
}

let pendingComplaintsMap = [];

function renderComplaints(list, containerId, isPending) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<p>No complaints found.</p>";
        return;
    }

    // Store list globally (or replace if separate lists)
    // Ideally we manage state better, but for this fix:
    pendingComplaintsMap = list;

    list.forEach((c, index) => {
        const div = document.createElement("div");
        div.className = "complaint-card card";
        div.innerHTML = `
            <h3>${c.name}</h3>
            <p><b>Phone:</b> ${c.number}</p>
            <p><b>City:</b> ${c.city}</p>
            <p><b>Status:</b> ${c.status}</p>
            <div class="description-preview">
                ${c.complaint_details.substring(0, 50)}...
            </div>
            <div class="actions" style="display: flex; gap: 8px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #f1f5f9;">
                <button onclick="viewDetails(${index})" class="btn btn-outline" style="padding: 6px 14px; font-size: 0.8rem; flex: 1;">View Details</button>
                <button onclick="acceptComplaint(${c.id})" class="btn btn-primary accept" style="padding: 6px 14px; font-size: 0.8rem; flex: 1;">Accept Case</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function viewDetails(index) {
    const c = pendingComplaintsMap[index];
    if (!c) return;
    // ... rest of viewDetails
    const modal = document.getElementById("details-modal");
    const body = document.getElementById("modal-body");
    // ...

    body.innerHTML = `
        <p><b>Complaint ID:</b> #${c.id}</p>
        <p><b>Name:</b> ${c.name}</p>
        <p><b>Phone:</b> ${c.number}</p>
        <p><b>City:</b> ${c.city}</p>
        <p><b>Gender:</b> ${c.gender}</p>
        <p><b>Status:</b> ${c.status}</p>
        <hr>
        <p><b>Details:</b></p>
        <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">${c.complaint_details}</p>
        ${c.complaint_file_url ? (
            c.complaint_file_url.match(/\.(jpg|jpeg|png|gif)$/i)
                ? `<p><b>Evidence Image:</b></p><img src="${c.complaint_file_url}" style="max-width: 100%; border-radius: 8px; margin-top: 10px; border: 1px solid #ddd;">`
                : `<p><b>File Link:</b> <a href="${c.complaint_file_url}" target="_blank" class="btn" style="display: inline-block; background: #2563eb; padding: 10px 20px; color: white; text-decoration: none; border-radius: 6px;">View Attachment</a></p>`
        ) : '<p><i>No attachment provided.</i></p>'}
    `;

    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("details-modal").style.display = "none";
}

window.onclick = function (event) {
    const modal = document.getElementById("details-modal");
    if (event.target == modal) {
        closeModal();
    }
}

async function acceptComplaint(id) {
    const lawyer_id = localStorage.getItem("user_id");
    if (!confirm("Are you sure you want to accept this case?")) return;

    try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${BASE_URL}/complaints/${id}/accept`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ lawyer_id: parseInt(lawyer_id) })
        });
        if (res.ok) {
            alert("Case accepted successfully! You can find it in 'My Cases'.");
            fetchPendingComplaints();
        } else {
            const data = await res.json();
            alert(data.detail || "Failed to accept case.");
        }
    } catch (e) {
        console.error(e);
        alert("Error accepting case.");
    }
}
// Expose functions to window for module support
window.viewDetails = viewDetails;
window.closeModal = closeModal;
window.acceptComplaint = acceptComplaint;
