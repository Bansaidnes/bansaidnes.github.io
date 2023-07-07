var url = "https://api.bansaidnes.me/Caesar?text=Bozo&key=12&encrypt=true";

function print(message, shift) {
    console.log (encrypt(message, shift));
}
function encrypt(str, shift) {
    fetch("https://api.bansaidnes.me/Caesar?text="+str+"&key="+shift+"&encrypt=true")
    .then(function(response)
    {
      return response.text();      
    }).then(async function(response)
    {
      document.getElementById("output").innerHTML = "Output: "+response;
    });
  }
  
function decrypt(str, shift) {
  fetch("https://api.bansaidnes.me/Caesar?text="+str+"&key="+shift+"&encrypt=false")
    .then(function(response)
    {
      return response.text();      
    }).then(async function(response)
    {
      document.getElementById("output").innerHTML = "Output: "+response;
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
