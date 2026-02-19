var short = "";
var shortenSuccess = false; 

function shorten(url) {
    const outputElement = document.getElementById("output");
    const btn = document.getElementById("shorten-btn");

    if (shortenSuccess) {
        outputElement.innerHTML = "Already shortened!";
        outputElement.style.color = "#a0a0a0"; 
        return;
    }

    if (!url || url.trim() === '') {
        outputElement.innerHTML = "Please enter a URL first!";
        outputElement.style.color = "#ff6b6b"; 

        setTimeout(() => {
            outputElement.innerHTML = "Shortened:";
            outputElement.style.color = "white"; 
        }, 3000);

        return; 
    }

    if(btn) {
        btn.innerText = "Shortening...";
        btn.disabled = true;
    }

    const fetchUrl = `${config.apibase}/shorten?_Destination=${url}`;
    
    fetch(fetchUrl)
    .then(function(response) {
        return response.text();
    }).then(async function(response) {
        short = `${config.sitebase}?t=${response}`;
        outputElement.innerHTML = "Shortened: " + short;
        shortenSuccess = true;
        
        if(btn) {
            btn.innerText = "Shortened";
            btn.disabled = true;
            btn.classList.add("secondary"); 
            btn.style.cursor = "default";
        }
    })
    .catch(() => {
        if(btn) {
            btn.innerText = "Shorten";
            btn.disabled = false;
        }
        outputElement.innerHTML = "Error occurred.";
    });
}

function copy() {
    if (!short) return;

    const outputElement = document.getElementById("output");
    navigator.clipboard.writeText(short);
    outputElement.innerHTML = "Copied :D!";
    
    delay(2500).then(() => {
        outputElement.innerHTML = "Shortened: " + short;
    });
}

var isHidden = false;
function hide() {
    if (!isHidden) {
        document.getElementById("panel").style.display = "none";
        isHidden = true;
    } else {
        delay(250).then(() => {
            document.getElementById("panel").style.display = "block";
            isHidden = false;
        });
    }
}