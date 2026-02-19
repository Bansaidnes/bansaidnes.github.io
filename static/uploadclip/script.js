const urlParams = new URLSearchParams(window.location.search);
var clipUrl = "";
const MAX_FILE_SIZE = 500 * 1024 * 1024;
let USER_TOKEN = localStorage.getItem("user_token");

document.addEventListener("DOMContentLoaded", async function() {
    if (!USER_TOKEN && typeof config !== 'undefined') {
        try {
            const res = await fetch(`${config.apibase}/Identity/init`);
            if (res.ok) {
                const data = await res.json();
                USER_TOKEN = data.token;
                localStorage.setItem("user_token", USER_TOKEN);
            }
        } catch (e) {
            console.error("Identity Init Failed:", e);
        }
    }
    
    const idDisplay = document.getElementById("user-id-display");
    if(idDisplay && USER_TOKEN) idDisplay.innerText = `ID: ${USER_TOKEN.substring(0,8)}...`;

    const form = document.getElementById("form");
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("vidUp");
    const errorPopup = document.getElementById("error-popup");

    if (typeof config !== 'undefined') {
        form.action = `${config.apibase}/ClipUp`;
    }

    fileInput.addEventListener('change', function(event) {
        let file = event.target.files[0];
        handleFile(file);
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('dragover');
    }

    function unhighlight() {
        dropZone.classList.remove('dragover');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        let dt = e.dataTransfer;
        let files = dt.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFile(files[0]);
        }
    }

    function showError(message) {
        if(errorPopup) {
            errorPopup.innerText = message;
            errorPopup.classList.add("show");
            setTimeout(() => { errorPopup.classList.remove("show"); }, 3000);
        } else {
            alert(message);
        }
    }

    function handleFile(file) {
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            showError("File too large! Max size is 500MB.");
            fileInput.value = "";
            const videoEl = document.querySelector("#preview-video");
            if(videoEl) {
                videoEl.style.display = 'none';
                videoEl.src = "";
            }
            const dropText = document.querySelector(".drop-text");
            if(dropText) dropText.style.display = "block";
            
            document.getElementById('filename').innerHTML = "Selected file: ";
            return;
        }

        let blobURL = URL.createObjectURL(file);
        const videoEl = document.querySelector("#preview-video");
        const dropText = document.querySelector(".drop-text");

        if(videoEl) {
            videoEl.style.display = 'block';
            videoEl.src = blobURL;
        }
        if(dropText) dropText.style.display = "none";

        const nameInput = document.getElementById('clipName');
        if(nameInput) nameInput.style.display = 'block';
        
        document.getElementById('filename').innerHTML = "Selected file: " + file.name;
    }

    if(form) form.addEventListener('submit', uploadReq);
});

window.switchTab = function(tabName) {
    const views = document.querySelectorAll('.content-section');
    
    views.forEach(view => {
        if (view.id === `view-${tabName}`) {
            view.classList.remove('hidden');
            view.classList.add('active');
            view.style.display = 'block';
        } else {
            view.classList.remove('active');
            view.classList.add('hidden');
            view.style.display = 'none';
        }
    });

    document.querySelectorAll('.toggle-container .btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('secondary');
    });
    
    const activeBtn = document.getElementById(`tab-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.classList.remove('secondary');
    }

    if (tabName === 'gallery') {
        loadGallery();
    }
}

async function loadGallery() {
    const grid = document.getElementById("gallery-grid");
    if(!grid) return;
    
    grid.innerHTML = '<p style="color: #ccc; text-align:center;">Loading clips...</p>';

    if(!USER_TOKEN) {
        grid.innerHTML = '<p style="color: #ff6b6b; text-align:center;">User identity not found.</p>';
        return;
    }

    try {
        const res = await fetch(`${config.apibase}/MyClips?token=${USER_TOKEN}`);
        if(!res.ok) throw new Error("Failed to fetch clips");
        const clips = await res.json();
        
        if(clips.length === 0) {
            grid.innerHTML = '<p style="color: #ccc; text-align:center;">No clips uploaded yet.</p>';
            return;
        }

        grid.innerHTML = "";
        clips.forEach(clip => {
            const clipID = clip.id || clip.ID;
            const clipName = clip.name || clip.Name || "Untitled";
            
            if(!clipID) return;

            const vidSrc = `${config.apibase}/ViewClip?id=${clipID}&compressed=true`;
            const viewLink = `${config.sitebase}/clip/?id=${clipID}`;
            
            const card = document.createElement("div");
            card.className = "clip-card-glass";
            
            card.innerHTML = `
                <div class="thumb-container">
                    <video src="${vidSrc}" muted onmouseover="this.play()" onmouseout="this.pause();this.currentTime=0;"></video>
                </div>
                <div class="card-info">
                    <div class="card-title" title="${clipName}">${clipName}</div>
                    <div class="card-actions">
                         <a href="${viewLink}" target="_blank" class="btn small">View</a>
                         <button onclick="navigator.clipboard.writeText('${viewLink}')" class="btn small secondary">Copy</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch(e) {
        console.error(e);
        grid.innerHTML = '<p style="color: #ff6b6b; text-align:center;">Error loading gallery.</p>';
    }
}

async function uploadReq(event) {
    event.preventDefault();

    const form = document.getElementById("form");
    const progressPanel = document.getElementById("progress-panel");
    const progressFill = document.getElementById("upload-progress-bar");
    const statusText = document.getElementById("status-text");
    const uploadBtn = document.getElementById("upload-btn");
    const fileLabel = document.getElementById("fileLabel");
    const clipNameInput = document.getElementById("clipName");
    const maxSizeText = document.getElementById("max-size-text");

    progressPanel.style.display = "block";
    uploadBtn.style.display = "none";
    if(fileLabel) fileLabel.style.display = "none";
    if(clipNameInput) clipNameInput.style.display = "none";
    if(maxSizeText) maxSizeText.style.display = "none";

    statusText.innerText = "Uploading...";
    progressFill.style.width = "0%";

    const url = form.action;
    const data = new FormData(form);
    
    if (USER_TOKEN) {
        data.append("ownerToken", USER_TOKEN);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;
            progressFill.style.width = percent + "%"; 
            if (percent >= 100) {
                statusText.innerText = "Compressing (this may take a moment)...";
                progressFill.classList.add("pulse-animation");
            }
        }
    });

    let seenBytes = 0;
    let buffer = "";

    xhr.onprogress = function () {
        const newResponse = xhr.responseText.substring(seenBytes);
        seenBytes = xhr.responseText.length;
        buffer += newResponse;

        const lines = buffer.split("\n\n");
        buffer = lines.pop();

        lines.forEach(line => {
            if (line.trim() === "") return;
            
            if (line.startsWith("data:") && !line.includes("{")) {
                const progressVal = parseInt(line.replace("data: ", ""));
                if (!isNaN(progressVal)) {
                    progressFill.style.width = progressVal + "%"; 
                    statusText.innerText = `Compressing: ${progressVal}%`;
                }
            }
            
            if (line.includes("data: {") && line.includes("}")) {
                 const jsonMatch = line.match(/data: (\{.*\})/);
                 if (jsonMatch && jsonMatch[1]) {
                    const responseObj = JSON.parse(jsonMatch[1]);
                    handleUploadSuccess(responseObj.id);
                 }
            }
        });
    };

    xhr.onload = function () {
        if (xhr.status === 200) {
            if (buffer.trim() !== "") {
                 const jsonMatch = buffer.match(/data: (\{.*\})/);
                 if (jsonMatch && jsonMatch[1]) {
                    const responseObj = JSON.parse(jsonMatch[1]);
                    handleUploadSuccess(responseObj.id);
                    return;
                 }
            }
            const allText = xhr.responseText;
            const jsonMatch = allText.match(/data: (\{.*\})/);
            if (jsonMatch && jsonMatch[1]) {
                const responseObj = JSON.parse(jsonMatch[1]);
                handleUploadSuccess(responseObj.id);
            } else {
                console.warn("Upload finished but ID not found in stream.");
            }
        } else {
            console.error("Server Error:", xhr.status, xhr.responseText);
            statusText.innerText = "Upload failed. Server Error.";
            uploadBtn.style.display = "inline-block";
        }
    };

    xhr.onerror = function () {
        console.error("Network Error - Check CORS, Protocol (HTTPS), or AdBlockers.");
        statusText.innerText = "Network Error.";
        uploadBtn.style.display = "inline-block";
    };

    xhr.send(data);
}

function handleUploadSuccess(id) {
    if (typeof config === 'undefined') return;

    clipUrl = `${config.sitebase}/clip/?id=${id}`;

    document.getElementById("progress-panel").style.display = "none";
    document.getElementById("success-panel").style.display = "block";

    const urlDisplay = document.getElementById("clip-url");
    urlDisplay.innerText = `Clip url: ${clipUrl}`;

    document.getElementById("copy-btn").style.display = "inline";
    
    let shortenBtn = document.getElementById("shorten-btn");
    if (!shortenBtn) {
        shortenBtn = document.createElement("button");
        shortenBtn.id = "shorten-btn";
        
        shortenBtn.className = "btn small secondary"; 
        
        shortenBtn.style.marginLeft = "10px";
        shortenBtn.innerText = "Shorten";
        shortenBtn.onclick = window.shortenClip;
        
        const copyBtn = document.getElementById("copy-btn");
        copyBtn.parentNode.insertBefore(shortenBtn, copyBtn.nextSibling);
    }
    shortenBtn.style.display = "inline";
    shortenBtn.disabled = false;
    shortenBtn.innerText = "Shorten";
    
    loadGallery();
}

window.shortenClip = async function() {
    const btn = document.getElementById("shorten-btn");
    const urlDisplay = document.getElementById("clip-url");
    
    if (!clipUrl) return;

    btn.innerText = "Shortening...";
    btn.disabled = true;

    try {
        const fetchUrl = `${config.apibase}/shorten?_Destination=${encodeURIComponent(clipUrl)}`;
        const response = await fetch(fetchUrl);
        const shortCode = await response.text();
        
        if (response.ok && shortCode) {
            clipUrl = `${config.sitebase}?t=${shortCode}`;
            urlDisplay.innerText = `Short url: ${clipUrl}`;
            
            btn.innerText = "Shortened";
            btn.disabled = true;
        } else {
            btn.innerText = "Failed";
            btn.disabled = false; 
            setTimeout(() => { btn.innerText = "Shorten"; }, 2000);
        }
    } catch (e) {
        console.error(e);
        btn.innerText = "Error";
        btn.disabled = false;
        setTimeout(() => { btn.innerText = "Shorten"; }, 2000);
    }
}

window.copy = function() {
    navigator.clipboard.writeText(clipUrl);
    const btn = document.getElementById("copy-btn");
    const originalText = btn.innerText;
    btn.innerText = "Copied!";
    setTimeout(() => { btn.innerText = originalText; }, 2000);
}