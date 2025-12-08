using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace BanHostAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class GetFilesController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetFiles(string token)
        {
            bool isTokenValid = true;
            User user;
            try { user = SqliteAccess.Query("Token", token); }
            catch (Exception e)
            {
                return BadRequest($"Unkown token\n{e.Message}");
                isTokenValid = false;
            }
            string dirPath = $"ReceivedFiles/{token.Replace("/", "").Replace("\\", "")}";
            if (isTokenValid)
            {
                List<BanFile> files = SqliteAccess.FileQuery("Owner", token);
                return Ok(files);
            }
            else return BadRequest("Unkown token");
        }
    }
}
