using Microsoft.AspNetCore.Mvc;

namespace BanHostAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ViewShowController : Controller
    {
        private const string CDN_BASE_URL = "https://access.cdn.bansaidn.es";

        [HttpGet]
        public IActionResult GetShow([FromQuery] string id, [FromQuery] string? season, [FromQuery] string? episode)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest("Show ID is required.");

            string epNum = string.IsNullOrEmpty(episode) ? "1" : episode;

            try
            {
                string objectPath;

                if (!string.IsNullOrEmpty(season))
                {
                    objectPath = $"Shows/{id}/{season}/{epNum}.mp4";
                }
                else
                {
                    objectPath = $"Shows/{id}/{epNum}.mp4";
                }

                string cdnUrl = $"{CDN_BASE_URL}/{objectPath}";

                return Redirect(cdnUrl);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error redirecting show: {ex.Message}");
                return StatusCode(500, "Error resolving video URL.");
            }
        }

        [HttpGet("subtitle")]
        public IActionResult GetSubtitle([FromQuery] string id, [FromQuery] string? season, [FromQuery] string? episode)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest("Show ID is required.");
            string epNum = string.IsNullOrEmpty(episode) ? "1" : episode;

            try
            {
                string objectPath;

                if (!string.IsNullOrEmpty(season))
                {
                    objectPath = $"Shows/{id}/{season}/Subtitles/{epNum}.srt";
                }
                else
                {
                    objectPath = $"Shows/{id}/Subtitles/{epNum}.srt";
                }

                string cdnUrl = $"{CDN_BASE_URL}/{objectPath}";

                return Redirect(cdnUrl);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error redirecting subtitle: {ex.Message}");
                return StatusCode(500, "Error resolving subtitle URL.");
            }
        }
    }
}