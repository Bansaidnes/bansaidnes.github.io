var short = "";
function shorten(url) {
    fetch("https://api.bansaidnes.tech/shorten?_Destination="+url)
    .then(function(response)
    {
      return response.text();      
    }).then(async function(response)
    {
      short = "url.bansaidnes.tech?t="+response;
      document.getElementById("output").innerHTML = "Shortened: "+short;
    });
  }
function copy()
{
  navigator.clipboard.writeText("https://"+short);
  document.getElementById("output").innerHTML = "Copied :D!";
  delay(2500).then(() => {
    document.getElementById("output").innerHTML = "Shortened: "+short;
  });
}
 var isHidden = false;
function hide(){
    if(!isHidden){
        document.getElementById("panel").style.display = "none";
        isHidden = true;
    } else {
        delay(250).then(() => {
        document.getElementById("panel").style.display = "block";
        isHidden = false;});
    }
} 
