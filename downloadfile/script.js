const urlParams = new URLSearchParams(window.location.search);
var id = urlParams.get('id');

if(id == null) id = 9050439;

var Url2 = 'https://df60-20-219-217-173.ngrok-free.app/api/publicfiledownload?id=' + id;
var Url = 'https://df60-20-219-217-173.ngrok-free.app/api/getfileinfo?id=' + id;

var image = false;
var filename = '';
getName();

console.log(Url);
console.log(filename)

function setPreview(){
    document.getElementById("preview").src = Url2;
}
function Download(){
    var link = document.createElement("a");
    link.download = filename;
    link.href = Url2;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}
function isIMage(fileName){
    var fileExt = getFileExtension(fileName);
    var imagesExtension = ["png", "jpg", "jpeg", "gif"];
    if(imagesExtension.indexOf(fileExt) !== -1){
        setPreview();
    } else{
      document.getElementById("preview").src = "noprv.png";
    }
}
function getFileExtension(fileName){
    var  fileExtension;
    fileExtension = fileName.replace(/^.*\./, '');
    return fileExtension;
}
function getName(){
    fetch(Url)
            .then(function(response)
            {
              return response.json();
            }).then(async function(response)
            {
              document.getElementById("download").innerHTML = "You are downloading: "+response.filename;
              filename = document.getElementById("download").innerHTML.replace("You are downloading: ", "");
              isIMage(filename);
            });
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
