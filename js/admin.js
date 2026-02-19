// const BASE_URL = "https://justice-nest-backend.onrender.com";
import BASE_URL from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("user_role");
  const token = localStorage.getItem("access_token");

  if (!token || role !== "admin") {
    console.warn("Unauthorized access attempt to admin dashboard");
    const container = document.getElementById("pending-lawyers-container");
    if (container) {
      container.innerHTML = `<div class="lawyer-card" style="padding: 20px; border-color: #e74c3c;">
                <h3 style="color: #e74c3c;">Access Denied</h3>
                <p>You must be logged in as an administrator to view this page.</p>
                <button onclick="window.location.href='login.html'" class="btn admin-btn" style="margin-top: 10px;">Go to Login</button>
            </div>`;
    }
    return;
  }

  fetchStats();
  fetchPendingLawyers();
});

async function fetchStats() {
  console.log("Fetching stats from:", `${BASE_URL}/admin/stats`);
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("No access token found in localStorage");
      return;
    }
    console.log("Using token:", token.substring(0, 10) + "...");
    const response = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    console.log("Stats response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stats response error text:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Stats data received:", data);

    document.getElementById("stat-total").innerText = data.total_complaints ?? 0;
    document.getElementById("stat-pending").innerText = data.pending_complaints ?? 0;
    document.getElementById("stat-accepted").innerText = data.accepted_complaints ?? 0;
    document.getElementById("stat-resolved").innerText = data.resolved_complaints ?? 0;
    document.getElementById("stat-lawyers").innerText = data.approved_lawyers ?? 0;
  } catch (error) {
    console.error("Error fetching stats:", error);
    const stats_elements = ["stat-total", "stat-pending", "stat-accepted", "stat-resolved", "stat-lawyers"];
    stats_elements.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.innerText === "...") {
        el.innerText = "?";
        el.title = "Failed to load: " + error.message;
      }
    });
  }
}

async function fetchPendingLawyers() {
  console.log("Fetching pending lawyers from:", `${BASE_URL}/admin/pending_lawyers`);
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("No access token found in localStorage");
      return;
    }
    const response = await fetch(`${BASE_URL}/admin/pending_lawyers`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    console.log("Pending lawyers response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pending lawyers error text:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const lawyers = await response.json();
    console.log("Lawyers data received:", lawyers);

    const container = document.getElementById("pending-lawyers-container");
    container.innerHTML = "";

    if (lawyers.length === 0) {
      container.innerHTML = "<p>No pending lawyers found.</p>";
      return;
    }

    lawyers.forEach(lawyer => {
      const card = document.createElement("div");
      card.className = "lawyer-card";

      const isPdf = lawyer.id_proof_url && lawyer.id_proof_url.toLowerCase().endsWith('.pdf');

      card.innerHTML = `
                <div class="lawyer-card-header">
                    <img src="${lawyer.photo_url || '../assets/default-lawyer.png'}" class="admin-lawyer-photo" alt="Profile">
                    <div>
                        <h3>${lawyer.name}</h3>
                        <small style="color: #718096;">Member since ${new Date(lawyer.created_at).toLocaleDateString()}</small>
                    </div>
                </div>
                <div class="lawyer-card-body">
                    <ul class="lawyer-details-list">
                        <li><b>Email:</b> <span>${lawyer.email || 'N/A'}</span></li>
                        <li><b>Phone:</b> <span>${lawyer.phone_number || 'N/A'}</span></li>
                        <li><b>Exp:</b> <span>${lawyer.years_of_experience || '0'} Years</span></li>
                        <li><b>Specialty:</b> <span>${lawyer.specialization || 'General'}</span></li>
                        <li><b>Location:</b> <span>${lawyer.city || 'N/A'}, ${lawyer.state || ''}</span></li>
                    </ul>
                    
                    <div class="proof-preview-container">
                        ${isPdf
          ? `<a href="${lawyer.id_proof_url}" target="_blank" class="pdf-link-container">
                               <span style="font-size: 30px;">📄</span>
                               <span>View PDF ID Proof</span>
                             </a>`
          : `<a href="${lawyer.id_proof_url}" target="_blank">
                               <img src="${lawyer.id_proof_url}" alt="ID Proof" class="proof-img">
                             </a>`
        }
                    </div>
                </div>
                <div class="lawyer-card-actions">
                    <button class="btn admin-btn approve" onclick="approveLawyer(${lawyer.id})">Approve</button>
                    <button class="btn admin-btn reject" onclick="rejectLawyer(${lawyer.id})">Reject</button>
                </div>
            `;
      container.appendChild(card);
    });

  } catch (error) {
    console.error("Error fetching pending lawyers:", error);
    const container = document.getElementById("pending-lawyers-container");
    if (container) {
      container.innerHTML = `<p style="color: red;">Error loading pending lawyers: ${error.message}</p>`;
    }
  }
}

// Expose functions to window for inline HTML onclick handlers
window.approveLawyer = approveLawyer;
window.rejectLawyer = rejectLawyer;

async function approveLawyer(id) {
  if (!confirm("Are you sure you want to approve this lawyer?")) return;

  try {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${BASE_URL}/admin/approve_lawyer/${id}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (response.ok) {
      alert("Lawyer Approved!");
      fetchPendingLawyers(); // Refresh list
    } else {
      alert("Failed to approve");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function rejectLawyer(id) {
  if (!confirm("Are you sure you want to REJECT this lawyer?")) return;


  try {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${BASE_URL}/admin/reject_lawyer/${id}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (response.ok) {
      alert("Lawyer Rejected!");
      fetchPendingLawyers();
    } else {
      alert("Failed to reject");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
