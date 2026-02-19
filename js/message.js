import BASE_URL from "./config.js";


let currentChatPartnerId = null;
let currentChatPartnerName = "";
let currentUserRole = localStorage.getItem("user_role");
if (currentUserRole === "users" || !currentUserRole) currentUserRole = localStorage.getItem("role") || "user";

let currentUserId = localStorage.getItem("user_id");
let pollingInterval = null;
let editingMessageId = null;

console.log("Chat system initialized:", { currentUserRole, currentUserId });

document.addEventListener("DOMContentLoaded", () => {
    checkBackend(); // Initial check

    if (!currentUserId || !currentUserRole) {
        window.location.href = "login.html";
        return;
    }

    // Check if we are opening a specific chat via URL params
    const urlParams = new URLSearchParams(window.location.search);
    const partnerId = urlParams.get("lawyer_id") || urlParams.get("user_id");

    if (partnerId) {
        currentChatPartnerId = parseInt(partnerId);
        startChat(currentChatPartnerId);
    }

    loadConversations();

    setInterval(loadConversations, 10000);
});

async function loadConversations() {
    try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${BASE_URL}/messages/conversations/${currentUserRole}/${currentUserId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        const list = document.getElementById("conversations-list");
        list.innerHTML = "";

        if (data.length === 0) {
            list.innerHTML = "<p class='loading'>No conversations yet.</p>";
            return;
        }

        data.forEach(conv => {
            const partnerId = conv.lawyer_id || conv.user_id;
            const item = document.createElement("div");
            item.className = `conversation-item ${currentChatPartnerId === partnerId ? 'active' : ''}`;
            item.onclick = () => startChat(partnerId, conv.name);

            item.innerHTML = `
                <h4>${conv.name}</h4>
                <p>${conv.last_message}</p>
            `;
            list.appendChild(item);
        });
    } catch (e) {
        console.error("Failed to load conversations:", e);
    }
}

function startChat(partnerId, name = null) {
    currentChatPartnerId = partnerId;

    // If name not provided, try to find it in sidebar
    if (!name) {
        const items = document.querySelectorAll('.conversation-item');
        items.forEach(item => {
            // This is a bit hacky, but helps if we open via URL
            if (item.onclick.toString().includes(partnerId)) {
                name = item.querySelector('h4').innerText;
            }
        });
    }

    currentChatPartnerName = name || "Chat Partner";
    document.getElementById("partner-name").innerText = currentChatPartnerName;
    document.getElementById("partner-status").innerText = "Online";

    // Highlight active in sidebar
    document.querySelectorAll(".conversation-item").forEach(item => item.classList.remove("active"));

    // Clear history and show a loading msg
    const history = document.getElementById("chat-history");
    history.innerHTML = "<div class='welcome-screen'><h2>Loading chat...</h2></div>";

    fetchMessages();

    // Start polling for new messages every 3 seconds
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(fetchMessages, 3000);
}

async function fetchMessages() {
    if (!currentChatPartnerId) return;

    try {
        const userId = currentUserRole === "user" ? currentUserId : currentChatPartnerId;
        const lawyerId = currentUserRole === "lawyer" ? currentUserId : currentChatPartnerId;

        const token = localStorage.getItem("access_token");
        const res = await fetch(`${BASE_URL}/messages/${userId}/${lawyerId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const messages = await res.json();

        const history = document.getElementById("chat-history");
        const isAtBottom = history.scrollHeight - history.scrollTop <= history.clientHeight + 100;

        history.innerHTML = "";

        messages.forEach(msg => {
            const isMine = msg.sender_role === currentUserRole;
            const bubble = document.createElement("div");
            bubble.className = `message-bubble ${isMine ? 'mine' : 'theirs'}`;

            // Ensure the date is interpreted as UTC by appending 'Z' if missing
            const createdAt = msg.created_at.includes('Z') ? msg.created_at : msg.created_at.replace(' ', 'T') + 'Z';
            const date = new Date(createdAt);
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

            bubble.innerHTML = `
                <div class="content">${msg.content}</div>
                <div class="message-meta">
                    <span>${time}</span>
                    ${isMine ? `
                        <div class="message-menu-trigger" onclick="toggleMessageMenu(event, ${msg.id})">⋮</div>
                        <div id="menu-${msg.id}" class="message-dropdown-menu">
                            <button onclick="openEditModal(${msg.id}, \`${msg.content.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`)">Edit</button>
                            <button onclick="deleteMessage(${msg.id})" class="delete-opt">Delete</button>
                        </div>
                    ` : ''}
                </div>
            `;
            history.appendChild(bubble);
        });

        if (isAtBottom) {
            history.scrollTop = history.scrollHeight;
        }
    } catch (e) {
        console.error("Failed to fetch messages:", e);
    }
}

async function handleSendMessage(event) {
    event.preventDefault();
    if (!currentChatPartnerId) {
        alert("Please select a conversation first.");
        return;
    }

    const input = document.getElementById("message-input");
    const content = input.value.trim();
    if (!content) return;

    // Validate IDs
    const userId = currentUserRole === "user" ? parseInt(currentUserId) : currentChatPartnerId;
    const lawyerId = currentUserRole === "lawyer" ? parseInt(currentUserId) : currentChatPartnerId;

    if (!userId || !lawyerId || isNaN(userId) || isNaN(lawyerId)) {
        alert("Authentication error: Please log in again.");
        window.location.href = "login.html";
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${BASE_URL}/messages/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                user_id: userId,
                lawyer_id: lawyerId,
                sender_role: currentUserRole,
                content: content
            })
        });

        if (res.ok) {
            input.value = "";
            fetchMessages();
            loadConversations();
        } else {
            const errorData = await res.json();
            alert("Error: " + (errorData.detail || "Failed to send message"));
        }
    } catch (e) {
        console.error("Error sending message:", e);
        alert("Network error: Could not reach server. Check if backend is running.");
    }
}

function toggleMessageMenu(event, id) {
    event.stopPropagation();
    const allMenus = document.querySelectorAll('.message-dropdown-menu');
    allMenus.forEach(menu => {
        if (menu.id !== `menu-${id}`) menu.style.display = 'none';
    });
    const menu = document.getElementById(`menu-${id}`);
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';

    // Close on click outside
    document.addEventListener('click', () => {
        menu.style.display = 'none';
    }, { once: true });
}

// Edit & Delete Logic
function openEditModal(id, content) {
    editingMessageId = id;
    document.getElementById("edit-input").value = content;
    document.getElementById("edit-modal").style.display = "block";
}

function closeEditModal() {
    document.getElementById("edit-modal").style.display = "none";
}

async function submitEdit() {
    const content = document.getElementById("edit-input").value.trim();
    if (!content) return;

    try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${BASE_URL}/messages/${editingMessageId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        if (res.ok) {
            closeEditModal();
            fetchMessages();
        }
    } catch (e) {
        console.error("Error editing message:", e);
    }
}

async function deleteMessage(id) {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${BASE_URL}/messages/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            fetchMessages();
        }
    } catch (e) {
        console.error("Error deleting message:", e);
    }
}

async function checkBackend() {
    try {
        const res = await fetch(`${BASE_URL}/lawyers/test`);
        if (res.ok) {
            console.log("✅ Backend is reachable");
        } else {
            console.warn("⚠️ Backend responded with error:", res.status);
        }
    } catch (e) {
        console.error("❌ Backend is UNREACHABLE:", e);
        alert("CRITICAL ERROR: The Backend Server is not running. Please start the server (python main.py) and refresh.");
    }
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

window.handleSendMessage = handleSendMessage;
window.toggleMessageMenu = toggleMessageMenu;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.submitEdit = submitEdit;
window.deleteMessage = deleteMessage;
window.logout = logout;
window.startChat = startChat;
