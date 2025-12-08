using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace BanHostAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class FileVisibilityController : ControllerBase
    {
        [HttpGet]
        public IActionResult Visibility(string id, string token, string visibility)
        {
            BanFile file = SqliteAccess.FileQuery("ID", id).First();

            if (file.filepath.Contains("/etc")) return BadRequest();

            if (token == file.owner) { 
                SqliteAccess.ChangeFileVisibility(token, id, visibility.ToLower());


            return Ok("File visibility changed!"); }
            else return BadRequest();
        }
    }
}
