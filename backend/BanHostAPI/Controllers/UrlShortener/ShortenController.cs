using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace BanHostAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ShortenController : ControllerBase
    { 
        
        [HttpGet]
        public IActionResult PostUrl(string _Destination)
        {
            try { if (_Destination.Substring(0, 8) != "https://") _Destination = "https://" + _Destination; }
            catch (Exception) { _Destination = "https://" + _Destination; }
            string Destination = Uri.EscapeDataString(_Destination);
            HttpClient client = new HttpClient();
                string tkn = GenerateToken();
                Shortened newShort = new Shortened();
                newShort.Token = tkn;
                newShort.RedUrl = Destination;
                SqliteAccess.SaveShort(newShort);
                return Ok(tkn);
        }
        public static string GenerateToken()
        {
            string Token = "";
			string tknchars = string.Empty;
			Enumerable.Range(48, 75)
              .Where(i => i < 58 || i > 64 && i < 91 || i > 96)
              .OrderBy(z => new Random().Next())
              .ToList()
              .ForEach(i => tknchars += Convert.ToChar(i)); 
            try { Token = tknchars.Substring(new Random().Next(0, tknchars.Length), new Random().Next(2, 6)); }
            catch (ArgumentOutOfRangeException) { Token = tknchars.Substring(new Random().Next(0, tknchars.Length), new Random().Next(6, 15)); }
			
            return Token;
		}
    }
}
