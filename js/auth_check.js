document.addEventListener("DOMContentLoaded", () => {
    updateNavbar();
});

function updateNavbar() {
    const primaryNav = document.querySelector(".primary-nav");
    const navActions = document.querySelector(".nav-actions");

    if (!primaryNav || !navActions) return;

    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");

    // Detect if we are in the /pages/ directory
    const pathParts = window.location.pathname.split("/");
    const isInPagesFolder = pathParts.includes("pages");

    // Correct base paths
    const rootBase = isInPagesFolder ? "../" : "./";
    const pagesBase = isInPagesFolder ? "./" : "./pages/";


    // 1. Update PRIMARY NAV
    let navHTML = `<a class="nav-link" href="${rootBase}index.html">Home</a>`;

    if (token) {
        if (role === "lawyer") {
            navHTML += `
                <a class="nav-link" href="${pagesBase}home.html">Dashboard</a>
                <a class="nav-link" href="${pagesBase}message.html">Messages</a>
                <a class="nav-link" href="${pagesBase}my_cases.html">My Cases</a>
                <a class="nav-link" href="${pagesBase}lawyer_profile.html">Profile</a>
            `;
        } else if (role === "user") {
            navHTML += `
                <a class="nav-link" href="${pagesBase}list.html">My Complaints</a>
                <a class="nav-link" href="${pagesBase}message.html">Messages</a>
                <a class="nav-link" href="${pagesBase}lawyer.html">Find Lawyers</a>
            `;
        } else if (role === "admin") {
            navHTML += `<a class="nav-link" href="${pagesBase}admin-dashboard.html">Admin Panel</a>`;
        }
    } else {
        navHTML += `<a class="nav-link" href="${pagesBase}lawyer.html">Find Lawyers</a>`;
    }

    navHTML += `<a class="nav-link" href="${pagesBase}about.html">About</a>`;
    primaryNav.innerHTML = navHTML;

    // 2. Update NAV ACTIONS
    if (token) {
        if (role === "user") {
            navActions.innerHTML = `
                <a class="btn btn-primary" href="${pagesBase}complaint.html">Register Complaint</a>
                <button class="btn btn-outline" onclick="handleGlobalLogout()">Logout</button>
            `;
        } else {
            navActions.innerHTML = `
                <button class="btn btn-outline" onclick="handleGlobalLogout()">Logout</button>
            `;
        }
    } else {
        navActions.innerHTML = `
            <a class="btn btn-primary" href="${pagesBase}complaint.html">Register Complaint</a>
            <a class="btn btn-outline" href="${pagesBase}login.html">Login</a>
        `;
    }


}

function handleGlobalLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("status");

    // Redirect to home page
    const pathParts = window.location.pathname.split("/");
    const isInPagesFolder = pathParts.includes("pages");
    window.location.href = isInPagesFolder ? "../index.html" : "index.html";
}
