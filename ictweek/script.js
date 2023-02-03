var url = "https://d8bd-20-219-217-173.in.ngrok.io/api/Caesar?text=Bozo&key=12&encrypt=true";

function print(message, shift) {
    console.log (encrypt(message, shift));
}
function encrypt(str, shift) {
    fetch("https://d8bd-20-219-217-173.in.ngrok.io/api/Caesar?text="+str+"&key="+shift+"&encrypt=true")
    .then(function(response)
    {
      return response.text();      
    }).then(async function(response)
    {
      document.getElementById("output").innerHTML = "Output: "+response;
    });
  }
  
function decrypt(str, shift) {
  fetch("https://d8bd-20-219-217-173.in.ngrok.io/api/Caesar?text="+str+"&key="+shift+"&encrypt=false")
    .then(function(response)
    {
      return response.text();      
    }).then(async function(response)
    {
      document.getElementById("output").innerHTML = "Output: "+response;
    });
}
  