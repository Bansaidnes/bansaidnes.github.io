const urlParams = new URLSearchParams(window.location.search);

var id = urlParams.get('id');
/*if(id == null) id = 'BZh1ajK80';*/

var Url = "https://api.bansaidnes.tech/ViewClip?id="+id;

console.log(Url);

function setsource()
{
    document.getElementById("player").src = Url;
}

var isHidden = false;
function hide(){
    if(!isHidden){
        document.getElementById("clip-panel").style.display = "none";
        isHidden = true;
    } else {
        delay(250).then(() => {
        document.getElementById("clip-panel").style.display = "block";
        isHidden = false;});
    }
}
