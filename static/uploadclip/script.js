const urlParams = new URLSearchParams(window.location.search);
var clipUrl = "";
const MAX_FILE_SIZE = 500 * 1024 * 1024; 

document.addEventListener("DOMContentLoaded", function() {
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
        errorPopup.innerText = message;
        errorPopup.classList.add("show");
        
        setTimeout(() => {
            errorPopup.classList.remove("show");
        }, 3000);
    }

    function handleFile(file) {
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            showError("File too large! Max size is 500MB.");
            fileInput.value = ""; 
            const videoEl = document.querySelector("video");
            videoEl.style.display = 'none';
            videoEl.src = "";
            document.querySelector(".drop-text").style.display = "block";
            document.getElementById('filename').innerHTML = "Selected file: ";
            return;
        }

        let blobURL = URL.createObjectURL(file);
        const videoEl = document.querySelector("video");
        const dropText = document.querySelector(".drop-text");
        
        videoEl.style.display = 'block';
        videoEl.src = blobURL;
        dropText.style.display = 'none';

        document.getElementById('clipName').style.display = 'block';
        document.getElementById('filename').innerHTML = "Selected file: " + file.name;
    }

    form.addEventListener('submit', uploadReq);
});

function copy() {
    navigator.clipboard.writeText(clipUrl);
    const urlText = document.getElementById("clip-url");
    urlText.innerText = "Copied :D!";

    setTimeout(() => {
        urlText.innerText = "Clip url: " + clipUrl;
    }, 2500);
}

function shorten() {
    if (typeof config === 'undefined') return;

    const shortApi = `${config.apibase}/shorten?_Destination=${clipUrl}`;

    fetch(shortApi)
    .then(function(response) {
        return response.text();
    })
    .then(function(response) {
        const shortUrl = `${config.sitebase}?t=${response}`;
        clipUrl = shortUrl;
        document.getElementById("clip-url").innerText = `Clip url: ${shortUrl}`;
    })
    .catch(err => console.error("Shortener error:", err));
}

async function uploadReq(event) {
    event.preventDefault();

    const form = document.getElementById("form");
    const progressPanel = document.getElementById("progress-panel");
    const uploadProgress = document.getElementById("upload-progress");
    const statusText = document.getElementById("status-text");
    const uploadBtn = document.getElementById("upload-btn");
    const fileLabel = document.getElementById("fileLabel");
    
    const clipNameInput = document.getElementById("clipName");
    const maxSizeText = document.getElementById("max-size-text"); // Select the text

    progressPanel.style.display = "block";
    uploadBtn.style.display = "none";
    fileLabel.style.display = "none";
    if(clipNameInput) clipNameInput.style.display = "none";
    if(maxSizeText) maxSizeText.style.display = "none"; // Hide the text

    statusText.innerText = "Uploading...";
    uploadProgress.value = 0;

    const url = form.action;
    const data = new FormData(form);
    const xhr = new XMLHttpRequest();

    xhr.open("POST", url, true);

    xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
            const percent = event.loaded / event.total;
            uploadProgress.value = percent;

            if (percent >= 1) {
                statusText.innerText = "Compressing (this may take a moment)...";
                uploadProgress.removeAttribute("value");
                uploadProgress.value = 0;
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
                    uploadProgress.value = progressVal / 100;
                    statusText.innerText = `Compressing: ${progressVal}%`;
                }
            }

            if (line.includes("event: complete")) {
                statusText.innerText = "Finalizing...";
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
                console.error("Could not parse final ID from stream");
                statusText.innerText = "Error parsing server response.";
            }
        } else {
            console.error("Server Error", xhr.status);
            statusText.innerText = "Upload failed.";
            uploadBtn.style.display = "inline-block";
        }
    };

    xhr.onerror = function () {
        console.error("Network Error");
        statusText.innerText = "Network Error.";
        uploadBtn.style.display = "inline-block";
    };

    xhr.send(data);
}

function handleUploadSuccess(id) {
    if (typeof config === 'undefined') return;

    clipUrl = `${config.clipbase}?id=${id}`;

    document.getElementById("progress-panel").style.display = "none";

    const finalLink = `${config.sitebase}/clip/?id=${id}`;

    const urlDisplay = document.getElementById("clip-url");
    urlDisplay.innerText = `Clip url: ${finalLink}`;
    clipUrl = finalLink;

    document.getElementById("copy-btn").style.display = "inline";
    document.getElementById("shorten-btn").style.display = "inline";
}