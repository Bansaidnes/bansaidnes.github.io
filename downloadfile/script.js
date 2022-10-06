const urlParams = new URLSearchParams(window.location.search);
var id = urlParams.get('id');

if(id == null) id = 67099983;

var Url2 = 'https://d8bd-20-219-217-173.in.ngrok.io/api/publicfiledownload?id=' + id;
var Url = 'https://d8bd-20-219-217-173.in.ngrok.io/api/getfileinfo?id=' + id;


var filename = getName();

console.log(Url);
console.log(filename)

function Download(){
    var link = document.createElement("a");
    link.download = filename;
    link.href = Url2;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}
function getName(){
    fetch(Url)
            .then(function(response)
            {
              return response.json();
            }).then(function(response)
            {
              document.getElementById("download").innerHTML = "You are downloading: "+response.filename;
            });
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
