const urlParams = new URLSearchParams(window.location.search);
var id = urlParams.get('id');

if(id == null) id = 9050439;

var Url2 = 'https://d8bd-20-219-217-173.in.ngrok.io/api/publicfiledownload?id=' + id;
var Url = 'https://d8bd-20-219-217-173.in.ngrok.io/api/getfileinfo?id=' + id;

console.log(Url);

function setPreview(prv){
    document.getElementById("preview").src = prv;
}
function Download(){
    var link = document.createElement("a");
    link.href = Url2;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}
function getFileExtension(fileName){
        var  fileExtension;
        fileExtension = fileName.replace(/^.*\./, '');
        return fileExtension;
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
