var short = "";

function shorten(url) {
    const outputElement = document.getElementById("output");

    if (!url || url.trim() === '') {
        outputElement.innerHTML = "Please enter a URL first!";
        outputElement.style.color = "#ff6b6b"; 

        setTimeout(() => {
            outputElement.innerHTML = "Shortened:";
            outputElement.style.color = "white"; 
        }, 3000);

        return; 
    }

    const fetchUrl = `${config.apibase}/shorten?_Destination=${url}`;
    
    fetch(fetchUrl)
    .then(function(response) {
        return response.text();
    }).then(async function(response) {
        short = `${config.sitebase}?t=${response}`;
        outputElement.innerHTML = "Shortened: " + short;
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