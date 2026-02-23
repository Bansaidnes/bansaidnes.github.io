document.addEventListener("DOMContentLoaded", function() {
    const API_URL = config.apibase; 

    const statusEl = document.getElementById("status-text");
    const passwordEl = document.getElementById("wake-password");
    const callBtn = document.getElementById("call-btn");
    const glassMsg = document.getElementById("glass-message");
    const glassMsgText = document.getElementById("glass-msg-text");
    
    const togglePasswordBtn = document.getElementById("toggle-password");
    const toggleIcon = document.getElementById("toggle-icon");

    let callTimeout = null;

    function showGlassAlert(message) {
        const overlay = document.createElement("div");
        overlay.className = "custom-alert-overlay";
        
        const box = document.createElement("div");
        box.className = "custom-alert-box glass-panel";
        
        box.innerHTML = `
            <div class="custom-alert-text">${message}</div>
            <div class="custom-alert-actions">
                <button class="custom-btn primary">OK</button>
            </div>
        `;
        
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        
        const close = () => overlay.remove();
        
        box.querySelector(".primary").onclick = close;
        overlay.onclick = (e) => { if(e.target === overlay) close(); };
    }

    function showGlassMessage(text, isError = false) {
        glassMsgText.innerText = text;
        const icon = glassMsg.querySelector("i");
        icon.className = isError ? "fas fa-exclamation-circle" : "fas fa-check-circle";
        icon.style.color = isError ? "#ff5555" : "#4ade80";
        glassMsg.classList.add("show");
        setTimeout(() => glassMsg.classList.remove("show"), 3000);
    }

    togglePasswordBtn.addEventListener("click", () => {
        if (passwordEl.type === "password") {
            passwordEl.type = "text";
            toggleIcon.classList.remove("fa-eye");
            toggleIcon.classList.add("fa-eye-slash");
            togglePasswordBtn.style.color = "var(--primary-color, #9d4edd)"; 
        } else {
            passwordEl.type = "password";
            toggleIcon.classList.remove("fa-eye-slash");
            toggleIcon.classList.add("fa-eye");
            togglePasswordBtn.style.color = "rgba(255, 255, 255, 0.4)"; 
        }
    });

    const eventSource = new EventSource(`${API_URL}/BanWake/events`);

    eventSource.onmessage = (event) => {
        if (event.data === 'user_answered') {
            clearTimeout(callTimeout); 
            updateStatus("Answered!", "answered");
            showGlassMessage("Device responded!");
        } 
        else if (event.data === 'device_ringing') {
            updateStatus("Ringing...", "ringing");
        }
    };

    eventSource.onerror = () => {
        console.warn("SSE connection lost. Retrying...");
    };

    callBtn.onclick = async () => {
        const password = passwordEl.value;
        if (!password) {
            return showGlassAlert("Please enter the password.");
        }

        try {
            const response = await fetch(`${API_URL}/BanWake/initiate?password=${encodeURIComponent(password)}`);
            
            if (response.status === 401) {
                showGlassAlert("Unauthorized\n\nThe password you entered is incorrect.");
            } 
            else if (response.status === 429) {
                showGlassAlert("Rate Limit Active\n\nPlease wait 5 seconds before initiating another call.");
            } 
            else if (response.ok) {
                updateStatus("Calling...", "calling");
                showGlassMessage("Signal sent to phone!");
                
                clearTimeout(callTimeout);
                callTimeout = setTimeout(() => {
                    if (statusEl.innerText === "Calling...") {
                        updateStatus("Unanswered", "failed");
                    }
                }, 120000); 
            }
            else {
                showGlassAlert("Server error: " + response.status);
            }
        } catch (error) {
            showGlassAlert("Server connection failed.");
        }
    };

    function updateStatus(text, className) {
        statusEl.innerText = text;
        statusEl.className = "status-display " + className;
    }
});