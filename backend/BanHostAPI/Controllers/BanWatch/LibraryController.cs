using BanHostAPI.Classes;
using BanHostAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace BanHostAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class LibraryController : ControllerBase
    {
        private readonly LibraryService _libService;

        public LibraryController(LibraryService libService)
        {
            _libService = libService;
        }
        [HttpGet("all")]
        public async Task<IActionResult> GetAllShows()
        {
            var shows = await _libService.GetLibraryAsync();
            return Ok(shows);
        }

        [HttpGet("details/{showId}")]
        public async Task<IActionResult> GetDetails(string showId)
        {
            var details = await _libService.GetShowDetailsAsync(showId);

            if (details == null) return NotFound();

            return Ok(details);
        }

        [HttpGet("banner/{showId}")]
        public IActionResult GetBanner(string showId)
        {
            var bannerUrl = _libService.GetBannerPath(showId);

            return Redirect(bannerUrl);
        }

        [HttpPost("progress")]
        public IActionResult SaveProgress(
            [FromForm] string userToken,
            [FromForm] string username,
            [FromForm] string showId,
            [FromForm] string? seasonId,
            [FromForm] string episodeId,
            [FromForm] double timestamp)
        {
            if (string.IsNullOrEmpty(userToken) || string.IsNullOrEmpty(showId)) return BadRequest();

            var prog = new UserProgress
            {
                UserToken = userToken,
                Username = username,
                ShowID = showId,
                SeasonID = seasonId,
                EpisodeID = episodeId,
                Timestamp = timestamp,
                LastUpdated = DateTime.UtcNow.ToString("O")
            };

            SqliteAccess.SaveUserProgress(prog);
            return Ok();
        }
    }
}