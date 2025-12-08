// This code will run automatically when the page's HTML has been fully loaded.

// 1. Get the clip ID from the page's URL (e.g., ?id=91iyhxb7J)
const urlParams = new URLSearchParams(window.location.search);
const clipId = urlParams.get('id');

// 2. Find the video player element in the HTML
const playerElement = document.getElementById('player');

// 3. Check if we found a clip ID in the URL and a player on the page
if (clipId && playerElement) {
    // 4. Construct the full video URL using the base URL from config.js
    const videoUrl = `${config.apibase}/ViewClip?id=${clipId}`;

    // 5. Set the video player's source to the new URL, causing it to load
    playerElement.src = videoUrl;

    console.log("Video source has been set to:", videoUrl);

} else {
    // This message will appear in the F12 console if something is wrong.
    console.error("Could not find a clip ID in the URL or the #player element on the page.");
}

// You can keep your 'hide()' function below if you still use it.
var isHidden = false;
function hide() {
    if(!isHidden){
        document.getElementById("clip-panel").style.display = "none";
        isHidden = true;
    } else {
        // You would need to define a delay function for this to work
        // delay(250).then(() => {
        //     document.getElementById("clip-panel").style.display = "block";
        //     isHidden = false;
        // });
    }
}