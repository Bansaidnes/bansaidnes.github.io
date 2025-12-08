using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;

namespace BanHostAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ViewClipController : Controller
    {
        private readonly IWebHostEnvironment _hostEnv;

        public ViewClipController(IWebHostEnvironment hostEnv)
        {
            _hostEnv = hostEnv;
        }

        [HttpGet]
        public async Task<IActionResult> ViewClip(string id, [FromQuery] bool compressed = false)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest("ID is required.");

            try
            {
                string contentRoot = _hostEnv.ContentRootPath;
                string filePath;

                if (compressed)
                {
                    filePath = Path.Combine(contentRoot, "Clips", "Compressed", $"{id}.mp4");
                }
                else
                {
                    filePath = Path.Combine(contentRoot, "Clips", $"{id}.mp4");
                }

                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound(compressed ? "Compressed video not found." : "Video not found.");
                }

                Stream streamFactory()
                {
                    return new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
                }

                return new FileStreamResult(streamFactory(), "video/mp4")
                {
                    EnableRangeProcessing = true,
                    FileDownloadName = $"{id}.mp4"
                };
            }
            catch (IOException ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                return StatusCode(500, "An error occurred while processing the video.");
            }
        }
    }
}