using BanHostAPI.Classes;
using BanHostAPI.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace BanHostAPI.Controllers.BanWatch
{
    [Route("[controller]")]
    [ApiController]
    public class CreateRoomController : ControllerBase
    {
        private readonly LibraryService _libService;

        public CreateRoomController(LibraryService libService)
        {
            _libService = libService;
        }

        [HttpPost]
        public IActionResult Create(
            [FromForm] string userToken,
            [FromForm] string username,
            [FromForm] string showId,
            [FromForm] string? seasonId,
            [FromForm] string? episodeId,
            [FromForm] bool allowMutualControl) 
        {
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(showId))
                return BadRequest("Username and ShowID are required.");
            if (username.Length > 24) 
                return BadRequest("Username must not exceed 24 characters.");

            string finalSeason = seasonId;
            string finalEp = episodeId;
            double startTime = 0;

            if (string.IsNullOrEmpty(seasonId) && string.IsNullOrEmpty(episodeId))
            {
                var start = _libService.GetStartPoint(userToken, showId);
                finalSeason = start.season;
                finalEp = start.episode;
                startTime = start.time;
            }
            else
            {
                finalEp = episodeId ?? "1";
            }

            string roomId = GenerateRoomCode();
            while (SqliteAccess.GetWatchRoom(roomId) != null)
            {
                roomId = GenerateRoomCode();
            }

            string hostToken = Guid.NewGuid().ToString("N");

            var initialMembers = new List<RoomMember>
    {
        new RoomMember { Username = username, IsHost = true }
    };

            var newRoom = new WatchRoom
            {
                RoomID = roomId,
                RoomName = $"{username}'s Room",
                ShowID = showId,
                SeasonID = finalSeason, 
                EpisodeID = finalEp,    
                HostToken = hostToken,
                Members = JsonSerializer.Serialize(initialMembers),
                CurrentTime = startTime, 
                IsPlaying = 0, 
                AllowMutualControl = allowMutualControl ? 1 : 0 
            };

            SqliteAccess.CreateWatchRoom(newRoom);

            return Ok(new
            {
                RoomID = roomId,
                HostToken = hostToken,
                Message = "Room created."
            });
        }

        private string GenerateRoomCode()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 6).Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
}