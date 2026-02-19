using Microsoft.AspNetCore.Mvc;

namespace BanHostAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ViewClipController : Controller
    {
        private const string CdnBaseUrl = "https://access.cdn.bansaidn.es";

        [HttpGet]
        public IActionResult ViewClip(string id, [FromQuery] bool compressed = false)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest("ID is required.");

            string remoteKey;

            if (compressed)
            {
                remoteKey = $"Clips/Compressed/{id}.mp4";
            }
            else
            {
                remoteKey = $"Clips/{id}.mp4";
            }

            return Redirect($"{CdnBaseUrl}/{remoteKey}");
        }
    }
}