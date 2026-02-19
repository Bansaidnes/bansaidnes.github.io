using BanHostAPI.Classes;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace BanHostAPI.Controllers.BanWatch
{
    [Route("[controller]")]
    [ApiController]
    public class JoinRoomController : ControllerBase
    {
        private readonly RoomSyncService _syncService;

        public JoinRoomController(RoomSyncService syncService)
        {
            _syncService = syncService;
        }

        [HttpPost]
        public IActionResult Join([FromForm] string roomCode, [FromForm] string username, [FromForm] string? hostToken)
        {
            var room = SqliteAccess.GetWatchRoom(roomCode);
            if (room == null) return NotFound("Room not found.");

            bool isHost = false;
            if (!string.IsNullOrEmpty(hostToken) && room.HostToken == hostToken)
            {
                isHost = true;
            }

            var members = JsonSerializer.Deserialize<List<RoomMember>>(room.Members) ?? new List<RoomMember>();

            if (members.Any(m => m.Username.Equals(username, StringComparison.OrdinalIgnoreCase)))
            {
                if (!isHost)
                {
                    return Conflict(new { message = "Username is already taken in this room." });
                }
            }

            if (!members.Any(m => m.Username == username))
            {
                members.Add(new RoomMember { Username = username, IsHost = isHost });
                string jsonMembers = JsonSerializer.Serialize(members);

                SqliteAccess.UpdateRoomMembers(roomCode, jsonMembers);

                _syncService.BroadcastToRoom(roomCode, JsonSerializer.Serialize(new
                {
                    type = "user_join",
                    username = username,
                    isHost = isHost
                }));
            }

            return Ok(new
            {
                ShowID = room.ShowID,
                SeasonID = room.SeasonID,
                EpisodeID = room.EpisodeID,
                RoomName = room.RoomName,
                CurrentTime = room.CurrentTime,
                IsPlaying = room.IsPlaying == 1,
                Members = members,
                IsYouHost = isHost,
                AllowMutualControl = room.AllowMutualControl == 1
            });
        }
    }
}