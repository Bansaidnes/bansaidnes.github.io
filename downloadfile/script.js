const urlParams = new URLSearchParams(window.location.search);
var fileName = urlParams.get('filename');
var id = urlParams.get('id');
if(fileName == null) fileName = "[Default]ripwin.png";
if(id == null) id = 56348970;

var Url = 'https://1b56-20-58-35-110.eu.ngrok.io/api/publicfiledownload?id=' + id;

console.log(Url);

function Download(){
    window.open(Url, "_self");
}
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }
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
