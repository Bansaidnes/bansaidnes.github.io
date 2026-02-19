using BanHostAPI.Classes;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text;

namespace BanHostAPI.Controllers.BanWatch
{
    [Route("[controller]")]
    [ApiController]
    public class RoomSyncController : ControllerBase
    {
        private readonly RoomSyncService _syncService;

        public RoomSyncController(RoomSyncService syncService)
        {
            _syncService = syncService;
        }

        [HttpGet("listen")]
        public async Task Listen(string roomCode, string username, CancellationToken ct)
        {
            Response.Headers.Add("Content-Type", "text/event-stream");
            Response.Headers.Add("Cache-Control", "no-cache");
            Response.Headers.Add("Connection", "keep-alive");
            Response.Headers.Add("X-Accel-Buffering", "no");

            var (reader, writer) = _syncService.JoinStream(roomCode, username);

            await Response.WriteAsync($"retry: 3000\ndata: {{\"type\":\"connected\"}}\n\n", ct);
            await Response.Body.FlushAsync(ct);

            try
            {
                var readTask = reader.WaitToReadAsync(ct).AsTask();

                while (!ct.IsCancellationRequested)
                {
                    var timeoutTask = Task.Delay(30000, ct);
                    var completedTask = await Task.WhenAny(readTask, timeoutTask);

                    if (completedTask == readTask)
                    {
                        if (await readTask)
                        {
                            while (reader.TryRead(out var message))
                            {
                                await Response.WriteAsync($"data: {message}\n\n", ct);
                            }
                            await Response.Body.FlushAsync(ct);
                            readTask = reader.WaitToReadAsync(ct).AsTask();
                        }
                        else break;
                    }
                    else
                    {
                        await Response.WriteAsync($"data: {{\"type\":\"ping\"}}\n\n", ct);
                        await Response.Body.FlushAsync(ct);
                    }
                }
            }
            catch (OperationCanceledException) { }
            finally
            {
                _syncService.RemoveStream(roomCode, username);

                await Task.Delay(5000);

                if (!_syncService.IsUserOnline(roomCode, username))
                {
                    HandleUserDisconnect(roomCode, username);
                }
            }
        }


        private void HandleUserDisconnect(string roomCode, string username)
        {
            try
            {
                var room = SqliteAccess.GetWatchRoom(roomCode);
                if (room == null) return;

                var members = JsonSerializer.Deserialize<List<RoomMember>>(room.Members) ?? new List<RoomMember>();
                var leaver = members.FirstOrDefault(m => m.Username == username);

                if (leaver != null)
                {
                    bool wasHost = leaver.IsHost;
                    members.Remove(leaver);

                    if (members.Count == 0)
                    {
                        SqliteAccess.DeleteRoom(roomCode);
                    }
                    else
                    {
                        if (wasHost)
                        {
                            var newHost = members.FirstOrDefault();
                            if (newHost != null)
                            {
                                newHost.IsHost = true;
                                string newHostToken = Guid.NewGuid().ToString("N");

                                SqliteAccess.UpdateRoomHost(roomCode, newHostToken, JsonSerializer.Serialize(members));

                                var payload = new
                                {
                                    type = "host_pass",
                                    newHost = newHost.Username,
                                    newHostToken = newHostToken
                                };
                                _syncService.BroadcastToRoom(roomCode, JsonSerializer.Serialize(payload));
                            }
                        }
                        else
                        {
                            SqliteAccess.UpdateRoomMembers(roomCode, JsonSerializer.Serialize(members));
                        }

                        _syncService.BroadcastToRoom(roomCode, JsonSerializer.Serialize(new { type = "user_leave", username = username }));
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error handling disconnect: {ex.Message}");
            }
        }

        [HttpPost("leave")]
        public IActionResult LeaveRoom([FromForm] string roomCode, [FromForm] string username)
        {
            HandleUserDisconnect(roomCode, username);
            return Ok();
        }

        [HttpPost("command")]
        public IActionResult Command([FromBody] SyncCommand cmd)
        {
            var room = SqliteAccess.GetWatchRoom(cmd.RoomCode);
            if (room == null) return NotFound();

            bool isHost = room.HostToken == cmd.HostToken;
            bool isMutual = room.AllowMutualControl == 1;

            if (!isHost)
            {
                if (!isMutual) return Unauthorized("Only the host can control playback.");

                if (!string.IsNullOrEmpty(cmd.Username))
                {
                    var members = JsonSerializer.Deserialize<List<RoomMember>>(room.Members) ?? new List<RoomMember>();
                    var user = members.FirstOrDefault(m => m.Username == cmd.Username);

                    if (user != null && user.IsBlocked)
                    {
                        return StatusCode(403, "You have been blocked from controlling playback.");
                    }
                }
            }

            SqliteAccess.UpdateRoomState(cmd.RoomCode, cmd.Timestamp, cmd.IsPlaying);

            var payload = new
            {
                type = "sync",
                action = cmd.Action,
                time = cmd.Timestamp,
                isPlaying = cmd.IsPlaying,
                senderToken = cmd.HostToken
            };

            _syncService.BroadcastToRoom(cmd.RoomCode, JsonSerializer.Serialize(payload));
            return Ok();
        }

        [HttpPost("kick")]
        public IActionResult KickUser([FromBody] KickCommand cmd)
        {
            var room = SqliteAccess.GetWatchRoom(cmd.RoomCode);
            if (room == null || room.HostToken != cmd.HostToken) return Unauthorized();

            SqliteAccess.RemoveRoomMember(cmd.RoomCode, cmd.TargetUsername);
            _syncService.BroadcastToRoom(cmd.RoomCode, JsonSerializer.Serialize(new { type = "kick", target = cmd.TargetUsername }));
            return Ok();
        }

        [HttpPost("block")]
        public IActionResult BlockUser([FromBody] BlockCommand cmd)
        {
            var room = SqliteAccess.GetWatchRoom(cmd.RoomCode);
            if (room == null || room.HostToken != cmd.HostToken) return Unauthorized();

            var members = JsonSerializer.Deserialize<List<RoomMember>>(room.Members) ?? new List<RoomMember>();
            var target = members.FirstOrDefault(m => m.Username == cmd.TargetUsername);

            if (target != null)
            {
                target.IsBlocked = cmd.Block;
                SqliteAccess.UpdateRoomMembers(cmd.RoomCode, JsonSerializer.Serialize(members));

                _syncService.BroadcastToRoom(cmd.RoomCode, JsonSerializer.Serialize(new
                {
                    type = "user_update",
                    username = cmd.TargetUsername,
                    isBlocked = cmd.Block
                }));
            }
            return Ok();
        }

        [HttpPost("close")]
        public IActionResult CloseRoom([FromBody] HostAuthCommand cmd)
        {
            var room = SqliteAccess.GetWatchRoom(cmd.RoomCode);
            if (room == null || room.HostToken != cmd.HostToken) return Unauthorized();

            _syncService.BroadcastToRoom(cmd.RoomCode, JsonSerializer.Serialize(new { type = "room_closed" }));
            SqliteAccess.DeleteRoom(cmd.RoomCode);
            return Ok();
        }

        [HttpPost("passHost")]
        public IActionResult PassHost([FromBody] HostAuthCommand cmd)
        {
            var room = SqliteAccess.GetWatchRoom(cmd.RoomCode);
            if (room == null || room.HostToken != cmd.HostToken) return Unauthorized();

            var members = JsonSerializer.Deserialize<List<RoomMember>>(room.Members) ?? new List<RoomMember>();

            string targetUser = cmd.TargetUsername ?? "";

            RoomMember newHostMember;
            if (!string.IsNullOrEmpty(targetUser))
            {
                newHostMember = members.FirstOrDefault(m => m.Username == targetUser);
            }
            else
            {
                newHostMember = members.FirstOrDefault(m => m.Username != cmd.Username);
            }

            if (newHostMember == null) return BadRequest("Target user not found.");

            foreach (var m in members) m.IsHost = (m.Username == newHostMember.Username);

            string newHostToken = Guid.NewGuid().ToString("N");
            SqliteAccess.UpdateRoomHost(cmd.RoomCode, newHostToken, JsonSerializer.Serialize(members));

            var payload = new
            {
                type = "host_pass",
                newHost = newHostMember.Username,
                newHostToken = newHostToken
            };
            _syncService.BroadcastToRoom(cmd.RoomCode, JsonSerializer.Serialize(payload));
            return Ok();
        }

        [HttpPost("changeSource")]
        public IActionResult ChangeSource([FromBody] ChangeSourceCommand cmd)
        {
            var room = SqliteAccess.GetWatchRoom(cmd.RoomCode);
            if (room == null || room.HostToken != cmd.HostToken) return Unauthorized();

            SqliteAccess.UpdateRoomVideo(cmd.RoomCode, cmd.ShowId, cmd.SeasonId, cmd.EpisodeId);

            var payload = new { type = "source_change", showId = cmd.ShowId, seasonId = cmd.SeasonId, episodeId = cmd.EpisodeId, senderToken = cmd.HostToken };
            _syncService.BroadcastToRoom(cmd.RoomCode, JsonSerializer.Serialize(payload));
            return Ok();
        }

        [HttpGet("valentine")]
        public IActionResult TriggerValentine([FromQuery] string roomCode)
        {
            if (string.IsNullOrWhiteSpace(roomCode)) return BadRequest();
            _syncService.BroadcastToRoom(roomCode, JsonSerializer.Serialize(new { type = "valentine" }));
            return Ok();
        }

        public class SyncCommand
        {
            public string RoomCode { get; set; }
            public string HostToken { get; set; }
            public string Username { get; set; }
            public string Action { get; set; }
            public double Timestamp { get; set; }
            public bool IsPlaying { get; set; }
        }

        public class KickCommand { public string RoomCode { get; set; } public string HostToken { get; set; } public string TargetUsername { get; set; } }
        public class BlockCommand { public string RoomCode { get; set; } public string HostToken { get; set; } public string TargetUsername { get; set; } public bool Block { get; set; } }
        public class HostAuthCommand { public string RoomCode { get; set; } public string HostToken { get; set; } public string Username { get; set; } public string? TargetUsername { get; set; } }
        public class ChangeSourceCommand { public string RoomCode { get; set; } public string HostToken { get; set; } public string ShowId { get; set; } public string SeasonId { get; set; } public string EpisodeId { get; set; } }
    }
}