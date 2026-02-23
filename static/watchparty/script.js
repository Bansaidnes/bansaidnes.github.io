document.addEventListener("DOMContentLoaded", function() {
    const API_URL = config.apibase; 
    const USERNAME_LIMIT = 24;

    const INVITE_DOMAIN = window.location.origin;
    const INVITE_PATH = window.location.pathname;

    const style = document.createElement('style');
    style.innerHTML = `
        .user-menu-modal {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px);
            display: flex; justify-content: center; align-items: center; z-index: 20000;
        }
        .user-menu-content {
            width: 320px; padding: 25px; border-radius: 20px;
            background: rgba(45, 20, 90, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px 0 rgba(0,0,0, 0.5);
            display: flex; flex-direction: column; gap: 12px;
            color: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .menu-header {
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 15px; margin-bottom: 5px;
            font-weight: 700; font-size: 1.2em; letter-spacing: 0.5px;
        }
        .menu-actions {
            display: flex; flex-direction: column; gap: 10px;
        }
        .menu-item-common {
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.05);
            padding: 0 15px; height: 50px;
            border-radius: 12px; color: white; 
            display: flex; align-items: center; justify-content: flex-start;
            font-size: 1rem; transition: all 0.2s ease; width: 100%; box-sizing: border-box;
            margin: 0; appearance: none; -webkit-appearance: none; font-family: inherit;
        }
        .menu-action-btn { cursor: pointer; gap: 12px; }
        .menu-action-btn:hover { background: rgba(255,255,255,0.2); transform: translateX(4px); }
        .menu-action-btn.danger { color: #ff8787; background: rgba(255, 50, 50, 0.15); border-color: rgba(255, 50, 50, 0.3); }
        .menu-action-btn.danger:hover { background: rgba(255, 50, 50, 0.25); }
        .menu-toggle-row { justify-content: space-between; cursor: default; }
        .close-menu-btn { background: none; border: none; color: rgba(255,255,255,0.6); font-size: 1.5em; cursor: pointer; padding: 0; line-height: 1; }
        .close-menu-btn:hover { color: white; }
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; transition: .4s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #8b5cf6; }
        input:checked + .slider:before { transform: translateX(20px); }
        .menu-dots-btn {
            background: rgba(139, 92, 246, 0.25); border: 1px solid rgba(139, 92, 246, 0.4);
            color: white; width: 28px; height: 28px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; cursor: pointer;
            font-size: 0.9rem; margin-left: 10px; padding: 0; transition: all 0.2s;
        }
        .menu-dots-btn:hover { background: rgba(139, 92, 246, 0.6); transform: scale(1.1); }
        .mutual-indicator {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 0.85rem; color: #a78bfa;
            margin-left: 15px; padding-left: 15px;
            border-left: 1px solid rgba(255,255,255,0.2);
            opacity: 0; transition: opacity 0.5s ease;
        }
        .mutual-indicator.visible { opacity: 1; }
        .mutual-indicator i { font-size: 0.9rem; }

        /* --- CUSTOM ALERT/CONFIRM MODAL --- */
        .custom-alert-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
            display: flex; justify-content: center; align-items: center;
            z-index: 30000; animation: fadeIn 0.2s ease-out;
        }
        .custom-alert-box {
            background: rgba(30, 20, 50, 0.95);
            border: 1px solid rgba(255,255,255,0.15);
            padding: 25px 30px; border-radius: 20px;
            text-align: center; max-width: 400px; width: 90%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6);
            transform: scale(0.9); animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .custom-alert-text { font-size: 1.1em; color: white; margin-bottom: 25px; line-height: 1.5; }
        .custom-alert-actions { display: flex; gap: 15px; justify-content: center; }
        .custom-btn {
            padding: 10px 25px; border-radius: 50px; border: none;
            font-size: 1em; cursor: pointer; transition: all 0.2s;
            font-family: inherit; font-weight: 600;
        }
        .custom-btn.primary { background: #8b5cf6; color: white; }
        .custom-btn.primary:hover { background: #7c3aed; transform: translateY(-2px); }
        .custom-btn.secondary { background: rgba(255,255,255,0.1); color: #ddd; }
        .custom-btn.secondary:hover { background: rgba(255,255,255,0.2); }
        
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes popIn { to { transform: scale(1); } }
    `;
    document.head.appendChild(style);

    let myUserToken = localStorage.getItem("userToken");
    if (!myUserToken) {
        myUserToken = crypto.randomUUID(); 
        localStorage.setItem("userToken", myUserToken);
    }
    let currentRoomCode = null;
    let myHostToken = localStorage.getItem("hostToken") || null;
    let myUsername = null;
    let isHost = false; 
    let allowMutualControl = false;
    let syncSource = null;
    let membersData = {}; 

    const sounds = {
        join: new Audio('/static/sounds/join.mp3'),
        leave: new Audio('/static/sounds/leave.mp3'),
        kick: new Audio('/static/sounds/kick.mp3')
    };
    Object.values(sounds).forEach(s => s.volume = 0.5);

    let isSyncing = false;
    let wasPlayingBeforeSeek = false;
    let currentShowDetails = null;
    let playingSeasonId = null;  
    let currentSeasonId = null;  
    let currentEpisodeId = null; 
    let progressInterval = null;

    let connectionWatchdog = null;
    const WATCHDOG_TIMEOUT = 45000; 

    function resetWatchdog() {
        if (connectionWatchdog) clearTimeout(connectionWatchdog);
        connectionWatchdog = setTimeout(() => {
            console.warn("Watchdog: Connection lost. Reconnecting...");
            if (syncSource) syncSource.close();
            connectSync(); 
        }, WATCHDOG_TIMEOUT);
    }

    const elements = {
        username: document.getElementById("username"),
        joinCode: document.getElementById("joinRoomCode"),
        joinBtn: document.getElementById("join-btn"),
        libraryGrid: document.getElementById("library-grid"),
        video: document.getElementById("videoPlayer"),
        seriesControls: document.getElementById("series-controls"),
        episodeFlyout: document.getElementById("episode-flyout"),
        seasonSelect: document.getElementById("season-select"),
        episodeGrid: document.getElementById("episode-grid"),
        npLabel: document.getElementById("np-label"),
        roomTitle: document.getElementById("room-title"),
        displayCode: document.getElementById("display-code"),
        membersList: document.getElementById("members-list"),
        statusDot: document.getElementById("status-dot"),
        statusText: document.getElementById("status-text"),
        glassMsg: document.getElementById("glass-message"),
        glassMsgText: document.getElementById("glass-msg-text"),
        hostModal: document.getElementById("host-modal"),
        mutualToggle: document.getElementById("mutual-control-toggle")
    };
    
    const mutualIndicator = document.createElement("span");
    mutualIndicator.className = "mutual-indicator";
    mutualIndicator.innerHTML = `<i class="fas fa-users-cog"></i> Mutual Control`;
    if(elements.statusText && elements.statusText.parentNode) {
        elements.statusText.parentNode.appendChild(mutualIndicator);
    }

    const views = {
        lobby: document.getElementById("lobby-view"),
        library: document.getElementById("library-view"),
        player: document.getElementById("player-view")
    };

    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('code');
    if (inviteCode && elements.joinCode) {
        elements.joinCode.value = inviteCode;
        elements.username.focus();
    }

    // --- VIDEO EVENTS ---
    elements.video.onplay = () => { if (isSyncing) return; if (isHost || allowMutualControl) sendCmd('play'); };
    elements.video.onpause = () => { if (isSyncing) return; if ((isHost || allowMutualControl) && !elements.video.seeking) sendCmd('pause'); };
    elements.video.onseeking = () => { if (isSyncing) return; if (isHost || allowMutualControl) wasPlayingBeforeSeek = !elements.video.paused; };
    elements.video.onseeked = () => { if (isSyncing) return; if (isHost || allowMutualControl) { const shouldPlay = wasPlayingBeforeSeek || !elements.video.paused; sendCmd('seek', shouldPlay); } };

    function sendCmd(action, playingState) {
        if(!isHost && !allowMutualControl) return;
        const isPlaying = playingState !== undefined ? playingState : !elements.video.paused;
        const tokenToSend = isHost ? myHostToken : myUserToken;

        fetch(`${API_URL}/RoomSync/command`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                roomCode: currentRoomCode, hostToken: tokenToSend, username: myUsername, 
                action: action, timestamp: elements.video.currentTime, isPlaying: isPlaying 
            })
        }).then(res => { if (res.status === 403) showGlassMessage("You are blocked from controlling playback.", true); });
    }

    function connectSync() {
        if(syncSource) syncSource.close();
        const ts = new Date().getTime();
        syncSource = new EventSource(`${API_URL}/RoomSync/listen?roomCode=${currentRoomCode}&username=${encodeURIComponent(myUsername)}&_=${ts}`);
        
        syncSource.onopen = () => {
            elements.statusDot.className = "status-dot connected";
            elements.statusText.innerText = "Connected";
            elements.statusText.style.color = "#4ade80";
            resetWatchdog(); 
        };
        
        syncSource.onmessage = (e) => {
            resetWatchdog(); 
            const msg = JSON.parse(e.data);
            
            if (msg.type === "ping") return;

            if (msg.type === "sync") {
                const myCurrentToken = isHost ? myHostToken : myUserToken;
                if (msg.senderToken === myCurrentToken) return;
                isSyncing = true; 
                const diff = Math.abs(elements.video.currentTime - msg.time);
                if (msg.action === "seek" || diff > 1.0) elements.video.currentTime = msg.time;
                if (msg.isPlaying) { if(elements.video.paused) elements.video.play().catch(()=>{}); } 
                else { if(!elements.video.paused) elements.video.pause(); }
                setTimeout(() => { isSyncing = false; }, 300);
            } 
            else if (msg.type === "source_change") { setupPlayerSource(msg.showId, msg.seasonId, msg.episodeId, 0, true); }
            else if (msg.type === "user_join") {
                sounds.join.play().catch(() => {});
                updateMembersList(msg.username, true, msg.isHost, false);
                if (isHost) { setTimeout(() => sendCmd('join_sync'), 1500); setTimeout(() => sendCmd('join_sync'), 3000); }
            }
            else if (msg.type === "user_leave") { sounds.leave.play().catch(() => {}); updateMembersList(msg.username, false); }
            else if (msg.type === "user_update") {
                const existingData = membersData[msg.username];
                const wasHost = existingData ? existingData.isHost : false;
                updateMembersList(msg.username, true, wasHost, msg.isBlocked);
            }
            else if (msg.type === "kick") {
                sounds.kick.play().catch(() => {});
                if (msg.target === myUsername) { 
                    showGlassAlert("You have been kicked by the host.", () => window.location.href = "/");
                } else { updateMembersList(msg.target, false); }
            }
            else if (msg.type === "room_closed") { 
                showGlassAlert("Host ended the party.", () => location.reload());
            }
            else if (msg.type === "host_pass") {
                Object.keys(membersData).forEach(u => { if (membersData[u]) membersData[u].isHost = false; });
                if (membersData[msg.newHost]) membersData[msg.newHost].isHost = true;

                if (msg.newHost === myUsername) {
                    myHostToken = msg.newHostToken; localStorage.setItem("hostToken", myHostToken);
                    isHost = true; showGlassMessage("You are now the Host!");
                } else {
                    if (isHost) { myHostToken = null; localStorage.removeItem("hostToken"); isHost = false; showGlassMessage("Host transferred to " + msg.newHost); }
                }
                refreshMembersUI();
            }
        };
        syncSource.onerror = () => {
             elements.statusDot.className = "status-dot disconnected";
             elements.statusText.innerText = "Reconnecting...";
             elements.statusText.style.color = "#ff4d4d";
             if (syncSource.readyState === EventSource.CLOSED) setTimeout(connectSync, 2000);
        };
    }

    async function setupPlayerSource(showId, seasonId, epId, time, isPlaying) {
        if(!currentShowDetails || currentShowDetails.id !== showId) {
            const res = await fetch(`${API_URL}/Library/details/${showId}`);
            currentShowDetails = await res.json();
        }
        if (currentShowDetails.isSeries) {
            if (!seasonId && currentShowDetails.seasons.length > 0) seasonId = currentShowDetails.seasons[0].id;
            if (!epId && currentShowDetails.seasons[0].episodes.length > 0) epId = currentShowDetails.seasons[0].episodes[0];
        }
        playingSeasonId = seasonId; currentSeasonId = seasonId; currentEpisodeId = epId;

        if (currentShowDetails.isSeries) {
            elements.seriesControls.classList.remove("hidden");
            elements.npLabel.innerText = `${seasonId} | Ep ${epId}`;
            renderSeasonSelector(); renderEpisodeGrid();
        } else { elements.seriesControls.classList.add("hidden"); }

        let src = `${API_URL}/ViewShow?id=${showId}`;
        if(seasonId) src += `&season=${encodeURIComponent(seasonId)}`;
        if(epId) src += `&episode=${epId}`;
        let subApiUrl = `${API_URL}/ViewShow/subtitle?id=${showId}`;
        if(seasonId) subApiUrl += `&season=${encodeURIComponent(seasonId)}`;
        if(epId) subApiUrl += `&episode=${epId}`;

        isSyncing = true;
        if(elements.video.getAttribute("data-src") !== src) {
            elements.video.crossOrigin = "anonymous"; elements.video.src = src; elements.video.setAttribute("data-src", src);
            elements.video.currentTime = time || 0; loadAndConvertSubtitles(subApiUrl);
            if(isPlaying) elements.video.play().catch(e=>{});
        }
        setTimeout(() => isSyncing = false, 500);
        startProgressSaver();
    }

    async function loadAndConvertSubtitles(url) {
        try {
            Array.from(elements.video.getElementsByTagName("track")).forEach(t => t.remove());
            const response = await fetch(url);
            if (!response.ok) return;
            const srtText = await response.text();
            let vttText = "WEBVTT\n\n" + srtText;
            vttText = vttText.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
            const blob = new Blob([vttText], { type: 'text/vtt' });
            const blobUrl = URL.createObjectURL(blob);
            const track = document.createElement("track");
            track.kind = "subtitles"; track.label = "English"; track.srclang = "en"; track.src = blobUrl;
            elements.video.appendChild(track);
        } catch (e) { console.log("Subtitle load failed:", e); }
    }

    // --- CUSTOM CONFIRM & ALERT MODALS ---

    function showGlassConfirm(message, onConfirm) {
        const overlay = document.createElement("div");
        overlay.className = "custom-alert-overlay";
        
        const box = document.createElement("div");
        box.className = "custom-alert-box glass-panel";
        
        box.innerHTML = `
            <div class="custom-alert-text">${message}</div>
            <div class="custom-alert-actions">
                <button class="custom-btn secondary">Cancel</button>
                <button class="custom-btn primary">Confirm</button>
            </div>
        `;
        
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        
        const close = () => overlay.remove();
        
        box.querySelector(".secondary").onclick = close;
        overlay.onclick = (e) => { if(e.target === overlay) close(); };
        
        box.querySelector(".primary").onclick = () => {
            onConfirm();
            close();
        };
    }

    function showGlassAlert(message, onOk) {
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
        
        const close = () => {
            overlay.remove();
            if (onOk) onOk();
        };
        
        box.querySelector(".primary").onclick = close;
        overlay.onclick = (e) => { if(e.target === overlay) close(); };
    }

    // --- MEMBER MANAGEMENT & GLOBAL MENU ---

    window.openUserMenu = (targetUser) => {
        const existing = document.getElementById("user-action-modal");
        if(existing) existing.remove();

        const userData = membersData[targetUser];
        const isBlocked = userData ? userData.isBlocked : false;

        const modal = document.createElement("div");
        modal.id = "user-action-modal";
        modal.className = "user-menu-modal";
        
        const content = document.createElement("div");
        content.className = "user-menu-content";
        content.onclick = (e) => e.stopPropagation();

        let blockControlHtml = '';
        if (allowMutualControl) {
            blockControlHtml = `
                <div class="menu-toggle-row menu-item-common">
                    <span>Block Control</span>
                    <label class="switch">
                        <input type="checkbox" id="block-toggle" ${isBlocked ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
            `;
        }

        content.innerHTML = `
            <div class="menu-header">
                <span>${targetUser}</span>
                <button class="close-menu-btn">&times;</button>
            </div>
            <div class="menu-actions">
                <button id="promote-btn" class="menu-action-btn menu-item-common">
                    <i class="fas fa-crown"></i> Promote to Host
                </button>
                ${blockControlHtml}
                <button id="kick-btn" class="menu-action-btn danger menu-item-common">
                    <i class="fas fa-door-open"></i> Kick User
                </button>
            </div>
        `;

        modal.appendChild(content);
        modal.onclick = () => modal.remove();
        content.querySelector(".close-menu-btn").onclick = () => modal.remove();
        
        content.querySelector("#promote-btn").onclick = () => {
            showGlassConfirm(`Make ${targetUser} the host? You will lose control.`, () => {
                passHost(targetUser);
                modal.remove();
            });
        };
        content.querySelector("#kick-btn").onclick = () => {
            showGlassConfirm(`Kick ${targetUser} from the room?`, () => {
                kickUser(targetUser);
                modal.remove();
            });
        };
        
        const toggle = content.querySelector("#block-toggle");
        if (toggle) {
            toggle.onchange = (e) => {
                toggleBlockUser(targetUser, e.target.checked);
            };
        }
        document.body.appendChild(modal);
    };

    function toggleBlockUser(user, blockStatus) {
        fetch(`${API_URL}/RoomSync/block`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ roomCode: currentRoomCode, hostToken: myHostToken, targetUsername: user, block: blockStatus })
        });
    }

    function updateMembersList(username, add, isMemberHost, isBlocked) {
        if (add) {
            let finalBlocked = isBlocked;
            if (typeof finalBlocked !== 'boolean') {
                finalBlocked = (membersData[username] && membersData[username].isBlocked) || false;
            }
            membersData[username] = { isHost: isMemberHost, isBlocked: finalBlocked };
        } else { delete membersData[username]; }

        const existing = document.querySelector(`.member-card[data-user="${username}"]`);
        if(add && existing) existing.remove();
        
        if(add) {
             const div = document.createElement("div");
             div.className = `member-card ${isMemberHost ? 'is-host' : ''}`; 
             div.setAttribute("data-user", username);
             
             let iconHtml = "";
             if (isMemberHost) iconHtml = `<i class="fas fa-crown" style="color:#ffd700; margin-right:8px;"></i>`;
             else if (membersData[username].isBlocked) iconHtml = `<i class="fas fa-ban" style="color:#ff5555; margin-right:8px;"></i>`;
             else iconHtml = `<i class="fas fa-user" style="color:#aaa; margin-right:8px;"></i>`;

             const nameSpan = document.createElement("span");
             nameSpan.innerHTML = `${iconHtml}${username}`;
             div.appendChild(nameSpan);

             if (isHost && username !== myUsername) {
                 const menuBtn = document.createElement("button");
                 menuBtn.className = "menu-dots-btn";
                 menuBtn.innerHTML = `<i class="fas fa-ellipsis-v"></i>`;
                 menuBtn.onclick = (e) => { e.stopPropagation(); window.openUserMenu(username); };
                 div.appendChild(menuBtn);
             }
             elements.membersList.appendChild(div);
        } else if (!add && existing) existing.remove();
    }

    function updateMembers(list) {
        elements.membersList.innerHTML = "";
        membersData = {}; 
        list.forEach(m => updateMembersList(m.username || m.Username, true, m.isHost || m.IsHost, !!(m.isBlocked || m.IsBlocked)));
    }

    function refreshMembersUI() {
        elements.membersList.innerHTML = "";
        Object.keys(membersData).forEach(u => { const m = membersData[u]; updateMembersList(u, true, m.isHost, m.isBlocked); });
    }

    window.kickUser = async (user) => {
        fetch(`${API_URL}/RoomSync/kick`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomCode: currentRoomCode, hostToken: myHostToken, targetUsername: user })
        });
    };

    function passHost(targetUser) {
        fetch(`${API_URL}/RoomSync/passHost`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ roomCode: currentRoomCode, hostToken: myHostToken, username: myUsername, targetUsername: targetUser })
        });
    }

    // --- LEAVE LOGIC ---
    window.addEventListener("beforeunload", () => {
        if (currentRoomCode && myUsername) {
            const formData = new FormData();
            formData.append("roomCode", currentRoomCode);
            formData.append("username", myUsername);
            navigator.sendBeacon(`${API_URL}/RoomSync/leave`, formData);
        }
    });

    // --- GENERIC UI ---
    window.openLibrary = () => {
        const user = elements.username.value.trim();
        // 2. CHECK USERNAME LENGTH (Fallback)
        if (user.length > USERNAME_LIMIT) return showGlassMessage(`Name too long (max ${USERNAME_LIMIT} chars)`, true);
        if(!user) return showGlassMessage("Enter username first", true);
        switchView("library"); loadLibrary();
    };
    window.backToLobby = () => switchView("lobby");
    
    elements.joinBtn.onclick = () => {
        const user = elements.username.value.trim();
        const code = elements.joinCode.value.trim().toUpperCase();
        if (user.length > USERNAME_LIMIT) return showGlassMessage(`Name too long (max ${USERNAME_LIMIT} chars)`, true);
        if(!user || !code) return showGlassMessage("Username & Code required", true);
        performJoin(code, user);
    };
    
    document.getElementById("leave-btn").onclick = () => {
        if(isHost) elements.hostModal.classList.add("active");
        else {
            showGlassConfirm("Leave the party?", () => location.reload());
        }
    };
    
    window.confirmCloseRoom = async () => {
        try {
            await fetch(`${API_URL}/RoomSync/close`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ roomCode: currentRoomCode, hostToken: myHostToken, username: myUsername })
            });
        } catch(e) { showGlassMessage("Error closing room", true); }
    };
    window.confirmPassHost = async () => passHost(null);
    document.getElementById("copy-code-btn").onclick = () => {
        const inviteLink = `${INVITE_DOMAIN}${INVITE_PATH}?code=${currentRoomCode}`;
        navigator.clipboard.writeText(inviteLink).then(() => {
            showGlassMessage("Invite Link Copied!");
        }).catch(err => { showGlassMessage("Failed to copy link", true); });
    };

    async function loadLibrary() {
        try {
            const res = await fetch(`${API_URL}/Library/all`);
            const shows = await res.json();
            elements.libraryGrid.innerHTML = "";
            shows.forEach(show => {
                const card = document.createElement("div");
                card.className = "show-card";
                card.onclick = () => createRoom(show.id, null, null);
                card.innerHTML = `<img src="${API_URL}${show.bannerUrl}" loading="lazy"><div class="show-title">${show.title}</div>`;
                elements.libraryGrid.appendChild(card);
            });
        } catch(e) { elements.libraryGrid.innerHTML = "Error loading library"; }
    }

    async function createRoom(showId, seasonId, episodeId) {
        const user = elements.username.value.trim();
        const allowMutual = elements.mutualToggle.checked; 
        const formData = new FormData();
        formData.append('userToken', myUserToken);
        formData.append('username', user);
        formData.append('showId', showId);
        if(seasonId) formData.append('seasonId', seasonId);
        if(episodeId) formData.append('episodeId', episodeId);
        formData.append('allowMutualControl', allowMutual); 
        try {
            const res = await fetch(`${API_URL}/CreateRoom`, { method: 'POST', body: formData });
            const data = await res.json();
            if(res.ok) {
                myHostToken = data.hostToken;
                localStorage.setItem("hostToken", myHostToken);
                await performJoin(data.roomID, user);
            } else showGlassMessage(data.message || "Failed", true);
        } catch(e) { showGlassMessage("Network Error", true); }
    }

    async function performJoin(code, user) {
        const formData = new FormData();
        formData.append('roomCode', code);
        formData.append('username', user);
        if(myHostToken) formData.append('hostToken', myHostToken);
        try {
            const res = await fetch(`${API_URL}/JoinRoom`, { method: 'POST', body: formData });
            if(!res.ok) throw new Error("Unable to join room");
            const data = await res.json();
            myUsername = user;
            isHost = data.isYouHost;
            allowMutualControl = data.allowMutualControl; 
            enterRoom(code, data);
        } catch(e) { showGlassMessage(e.message || "Error", true); }
    }

    function enterRoom(code, data) {
        currentRoomCode = code;
        elements.displayCode.innerText = code;
        elements.roomTitle.innerText = data.roomName;
        switchView("player");
        updateMembers(data.members);
        setupPlayerSource(data.showID, data.seasonID, data.episodeID, data.currentTime, data.isPlaying);
        connectSync();
        
        if (allowMutualControl) {
            mutualIndicator.classList.add("visible");
            showGlassMessage("Mutual Control Enabled!");
        } else {
            mutualIndicator.classList.remove("visible");
        }
    }

    window.toggleFlyout = (show) => {
        if(show) elements.episodeFlyout.classList.add("active");
        else elements.episodeFlyout.classList.remove("active");
    };

    function renderSeasonSelector() {
        elements.seasonSelect.innerHTML = "";
        currentShowDetails.seasons.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.innerText = s.name;
            if(s.id === currentSeasonId) opt.selected = true;
            elements.seasonSelect.appendChild(opt);
        });
        elements.seasonSelect.onchange = (e) => {
            currentSeasonId = e.target.value;
            renderEpisodeGrid();
        };
    }

    function renderEpisodeGrid() {
        elements.episodeGrid.innerHTML = "";
        const season = currentShowDetails.seasons.find(s => s.id === currentSeasonId);
        if(!season) return;
        season.episodes.forEach(ep => {
            const isPlayingThisSeason = (currentSeasonId === playingSeasonId);
            const isActive = isPlayingThisSeason && (ep === currentEpisodeId);
            const btn = document.createElement("div");
            btn.className = `ep-btn ${isActive ? 'active' : ''}`;
            btn.innerText = ep;
            btn.onclick = () => {
                requestSourceChange(currentShowDetails.id, currentSeasonId, ep);
                toggleFlyout(false);
            };
            elements.episodeGrid.appendChild(btn);
        });
    }

    function requestSourceChange(show, season, ep) {
        if(!isHost) return showGlassMessage("Only Host can change video", true);
        const payload = { 
            roomCode: currentRoomCode, 
            hostToken: myHostToken, 
            showId: String(show), 
            seasonId: season ? String(season) : "", 
            episodeId: ep ? String(ep) : "" 
        };
        fetch(`${API_URL}/RoomSync/changeSource`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        toggleFlyout(false);
    }

    function startProgressSaver() {
        if (progressInterval) clearInterval(progressInterval);
        progressInterval = setInterval(() => {
            if (!elements.video.paused && currentShowDetails && myUsername) {
                const fd = new FormData();
                fd.append('userToken', myUserToken);
                fd.append('username', myUsername);
                fd.append('showId', currentShowDetails.id);
                if(currentSeasonId) fd.append('seasonId', currentSeasonId);
                fd.append('episodeId', currentEpisodeId || "1");
                fd.append('timestamp', elements.video.currentTime);
                navigator.sendBeacon(`${API_URL}/Library/progress`, fd);
            }
        }, 10000);
    }

    function switchView(view) {
        Object.values(views).forEach(v => { v.classList.remove("active"); v.classList.add("hidden"); });
        views[view].classList.remove("hidden");
        setTimeout(() => views[view].classList.add("active"), 10);
    }

    function showGlassMessage(text, isError = false) {
        elements.glassMsgText.innerText = text;
        elements.glassMsg.querySelector("i").className = isError ? "fas fa-exclamation-circle" : "fas fa-check-circle";
        elements.glassMsg.querySelector("i").style.color = isError ? "#ff5555" : "#4ade80";
        elements.glassMsg.classList.add("show");
        setTimeout(() => elements.glassMsg.classList.remove("show"), 3000);
    }
});