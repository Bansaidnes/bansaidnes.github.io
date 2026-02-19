using System.Collections.Concurrent;
using System.Threading.Channels;

namespace BanHostAPI.Classes
{
    public class RoomSyncService
    {
        private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, ChannelWriter<string>>> _rooms
            = new ConcurrentDictionary<string, ConcurrentDictionary<string, ChannelWriter<string>>>();

        public (ChannelReader<string>, ChannelWriter<string>) JoinStream(string roomId, string username)
        {
            var channel = Channel.CreateUnbounded<string>();
            var writer = channel.Writer;

            _rooms.AddOrUpdate(roomId,
                (key) => {
                    var dict = new ConcurrentDictionary<string, ChannelWriter<string>>();
                    dict.TryAdd(username, writer);
                    return dict;
                },
                (key, userDict) => {
                    userDict.AddOrUpdate(username, writer, (k, oldVal) => writer);
                    return userDict;
                });

            return (channel.Reader, writer);
        }

        public void RemoveStream(string roomId, string username)
        {
            if (_rooms.TryGetValue(roomId, out var userDict))
            {
                userDict.TryRemove(username, out _);

                if (userDict.IsEmpty)
                {
                    _rooms.TryRemove(roomId, out _);
                }
            }
        }

        public bool IsUserOnline(string roomId, string username)
        {
            if (_rooms.TryGetValue(roomId, out var userDict))
            {
                return userDict.ContainsKey(username);
            }
            return false;
        }

        public void BroadcastToRoom(string roomId, string message)
        {
            if (_rooms.TryGetValue(roomId, out var userDict))
            {
                foreach (var kvp in userDict)
                {
                    var writer = kvp.Value;
                    writer.TryWrite(message);
                }
            }
        }
    }
}  