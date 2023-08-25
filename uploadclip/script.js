const urlParams = new URLSearchParams(window.location.search);

var clipUrl = "";

function setName(){
    document.getElementById('vidUp').onchange = function () {
        var name = this.value;
        document.getElementById('filename').innerHTML = "Selected file: " + name.replace("C:\\fakepath\\", "");
      };
}

document.getElementById("vidUp").addEventListener('change', function(event) {
    let file = event.target.files[0];
    let blobURL = URL.createObjectURL(file);
    document.querySelector("video").style.display = 'block';
    document.querySelector("video").src = blobURL;
}); 

form.addEventListener('submit', uploadReq);

function copy()
{
  navigator.clipboard.writeText(clipUrl);
  document.getElementById("clip-url").innerHTML = "Copied :D!";
  delay(2500).then(() => {
    document.getElementById("clip-url").innerHTML = "Clip url: "+clipUrl.replace("https://", "");
  });
}

async function uploadReq(event) {
    event.preventDefault();

    document.getElementById("progress-panel").style.display = "block";
    const url = new URL(form.action);
    const data = new FormData(form);
    const uploadProgress = document.getElementById("upload-progress");
  
    const xhr = new XMLHttpRequest();
    const success = await new Promise((resolve) => {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          uploadProgress.value = event.loaded / event.total;
        }
      });

      xhr.addEventListener("loadend", () => {
        resolve(xhr.readyState === 4 && xhr.status === 200);
      });

      xhr.open("POST", url, true);
      xhr.send(data);
    });
    console.log("success? ", success);
    var id = JSON.parse(xhr.response).id;
    clipUrl = "https://bansaidnes.tech/clip?id="+id;
    document.querySelectorAll("#progress-panel, #upload-btn, #fileLabel").forEach((element)=>{
      element.style.display = "none";});
    document.getElementById("clip-url").innerText = "Clip url: bansaidnes.tech/clip?id="+id;
    document.getElementById("copy-btn").style.display = "inline";
  }
  uploadReq().catch(console.error);

var isHidden = false;
function hide(){
    if(!isHidden){
        document.getElementById("download-panel").style.display = "none";
        isHidden = true;
    } else {
        delay(250).then(() => {
        document.getElementById("download-panel").style.display = "block";
        isHidden = false;});
    }
}

