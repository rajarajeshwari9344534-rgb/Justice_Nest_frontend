import BASE_URL from "./config.js";
let ALL_LAWYERS = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchApprovedLawyers();
});

async function fetchApprovedLawyers() {
  try {
    const response = await fetch(`${BASE_URL}/lawyers/`);
    ALL_LAWYERS = await response.json();
    renderLawyers(ALL_LAWYERS);
  } catch (error) {
    console.error("Error:", error);
  }
}

function renderLawyers(lawyers) {
  const container = document.querySelector(".lawyer-grid");
  container.innerHTML = "";

  if (lawyers.length === 0) {
    container.innerHTML = "<div style='grid-column: 1/-1; text-align: center; padding: 50px; background: #fff; border-radius: 20px;'><h3>No lawyers found matching your criteria.</h3><p>Try resetting the filters or searching with different terms.</p></div>";
    return;
  }

  lawyers.forEach(l => {
    const card = document.createElement("div");
    card.className = "lawyer-card card";
    card.innerHTML = `
            <div class="lawyer-photo-container">
                <img src="${l.photo_url || '../assets/default-lawyer.png'}" class="lawyer-photo" alt="Lawyer">
            </div>
            <div class="lawyer-info">
              <div class="lawyer-header">
                <h3>${l.name}</h3>
                <span class="spec-tag">${l.specialization}</span>
              </div>
              
              <div class="lawyer-details">
                <p><i class="icon">📍</i> ${l.city || ''}${l.city && l.state ? ', ' : ''}${l.state || ''}</p>
                <p><i class="icon">⏳</i> ${l.years_of_experience} Years Experience</p>
                <p><i class="icon">💳</i> Fees: ${l.fees_range}</p>
                <p><i class="icon">👤</i> Gender: ${l.gender}</p>
              </div>

              <div class="lawyer-contact-info">
                <p><strong>📞 Phone:</strong> ${l.phone_number}</p>
              </div>

              <button class="btn btn-primary btn-contact" onclick="sendInquiry(${l.id}, '${l.name}')" style="width: 100%; margin-top: 20px;">
                💬 Message Lawyer
              </button>
            </div>
        `;
    container.appendChild(card);
  });
}

function applyFilters() {
  const search = document.getElementById("search-input").value.toLowerCase();
  const city = document.getElementById("city-filter").value.toLowerCase();
  const state = document.getElementById("state-filter").value.toLowerCase();
  const spec = document.getElementById("spec-filter").value;
  const gender = document.getElementById("gender-filter").value;
  const minExp = parseFloat(document.getElementById("exp-filter").value) || 0;
  const maxFeesInput = document.getElementById("fees-filter").value;
  const maxFees = maxFeesInput ? parseFloat(maxFeesInput) : Infinity;
  const phone = document.getElementById("phone-filter").value.toLowerCase();

  const filtered = ALL_LAWYERS.filter(l => {
    const matchesSearch = !search ||
      l.name.toLowerCase().includes(search) ||
      l.specialization.toLowerCase().includes(search);

    const matchesCity = !city || l.city?.toLowerCase().includes(city);
    const matchesState = !state || l.state?.toLowerCase().includes(state);
    const matchesSpec = !spec || l.specialization === spec;
    const matchesGender = !gender || l.gender === gender;
    const matchesExp = l.years_of_experience >= minExp;

    // Dynamic fees extraction (e.g., "₹3000 - ₹7000" -> 7000)
    let lawyerMaxFee = 0;
    if (l.fees_range.toLowerCase().includes("pro bono")) {
      lawyerMaxFee = 0;
    } else {
      const numbers = l.fees_range.match(/\d+/g);
      if (numbers) lawyerMaxFee = Math.max(...numbers.map(Number));
    }
    const matchesFees = lawyerMaxFee <= maxFees;

    const matchesPhone = !phone || l.phone_number.includes(phone);

    return matchesSearch && matchesCity && matchesState && matchesSpec &&
      matchesGender && matchesExp && matchesFees && matchesPhone;
  });

  renderLawyers(filtered);
}

function resetFilters() {
  document.getElementById("search-input").value = "";
  document.getElementById("city-filter").value = "";
  document.getElementById("state-filter").value = "";
  document.getElementById("spec-filter").value = "";
  document.getElementById("gender-filter").value = "";
  document.getElementById("exp-filter").value = "";
  document.getElementById("fees-filter").value = "";
  document.getElementById("phone-filter").value = "";
  renderLawyers(ALL_LAWYERS);
}

function sendInquiry(lawyerId, name) {
  if (!localStorage.getItem("user_id")) {
    alert("Please login as a user to message lawyers.");
    window.location.href = "login.html";
    return;
  }
  window.location.href = `../pages/message.html?lawyer_id=${lawyerId}`;
}
// Expose functions to window for module support
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.sendInquiry = sendInquiry;
