const urlParams = new URLSearchParams(window.location.search);
console.log("ID: ", urlParams.get('id'));
var Url = 'https://1b56-20-58-35-110.eu.ngrok.io/api/publicfiledownload?id=' + urlParams.get('id');

console.log(Url);

function Download(){
    window.open(Url, "_self");
}
