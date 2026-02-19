import BASE_URL from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    fetchMyCases();
});

async function fetchMyCases() {
    const lawyer_id = localStorage.getItem("user_id");
    if (!lawyer_id) {
        window.location.href = "login.html";
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${BASE_URL}/complaints/lawyer/${lawyer_id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const complaints = await response.json();
        renderComplaints(complaints);
    } catch (e) {
        console.error(e);
        document.getElementById("my-cases-container").innerHTML = "<p>Error loading cases.</p>";
    }
}

function renderComplaints(list) {
    const container = document.getElementById("my-cases-container");
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<p>You haven't accepted any cases yet.</p>";
        return;
    }

    list.sort((a, b) => (a.status === 'resolved' ? 1 : -1)); // Show active ones first

    // Store globally
    window.myCasesMap = list;

    list.forEach((c, index) => {
        const div = document.createElement("div");
        div.className = "complaint-card card";
        div.innerHTML = `
            <h3>${c.name}</h3>
            <p><b>Phone:</b> ${c.number}</p>
            <p><b>City:</b> ${c.city}</p>
            <p><b>Status:</b> <span class="status-tag ${c.status}">${c.status.toUpperCase()}</span></p>
            <div class="description-preview">
                ${c.complaint_details.substring(0, 50)}...
            </div>
            <div class="actions" style="display: flex; gap: 8px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #f1f5f9;">
                <button onclick="viewDetails(${index})" class="btn btn-outline" style="padding: 6px 14px; font-size: 0.8rem; flex: 1;">View Details</button>
                ${c.status !== 'resolved' ? `<button onclick="resolveComplaint(${c.id})" class="btn btn-primary accept" style="padding: 6px 14px; font-size: 0.8rem; flex: 1;">Resolve Case</button>` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

function viewDetails(index) {
    const c = window.myCasesMap[index];
    if (!c) return;

    const modal = document.getElementById("details-modal");
    const body = document.getElementById("modal-body");

    body.innerHTML = `
        <p><b>Case ID:</b> #${c.id}</p>
        <p><b>Client name:</b> ${c.name}</p>
        <p><b>Phone:</b> ${c.number}</p>
        <p><b>City:</b> ${c.city}</p>
        <p><b>State:</b> ${c.state}</p>
        <p><b>Status:</b> ${c.status}</p>
        <hr>
        <p><b>Description:</b></p>
        <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 8px;">${c.complaint_details}</p>
        ${c.complaint_file_url ? `<p><b>File Link:</b> <a href="${c.complaint_file_url}" target="_blank">View Evidence</a></p>` : ''}
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

async function resolveComplaint(id) {
    if (!confirm("Are you sure you want to mark this case as RESOLVED?")) return;

    try {
        const formData = new FormData();
        formData.append("status", "resolved");

        const token = localStorage.getItem("access_token");
        const res = await fetch(`${BASE_URL}/complaints/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            alert("Case marked as resolved successfully!");
            fetchMyCases();
        } else {
            alert("Failed to update status.");
        }
    } catch (e) {
        console.error(e);
        alert("Error updating status.");
    }
}
// Expose functions to window for module support
window.viewDetails = viewDetails;
window.closeModal = closeModal;
window.resolveComplaint = resolveComplaint;
