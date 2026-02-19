using Microsoft.AspNetCore.Mvc;

namespace BanHostAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class MyClipsController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetMyClips(string token)
        {
            if (string.IsNullOrEmpty(token)) return BadRequest("Token required");

            var clips = SqliteAccess.GetClipsByOwner(token);
            return Ok(clips);
        }
    }
}