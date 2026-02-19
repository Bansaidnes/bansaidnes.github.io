namespace BanHostAPI.Classes
{
    public class WatchRoom
    {
        public string HostToken { get; set; }
        public string RoomID { get; set; }
        public string RoomName { get; set; }
        public string ShowID { get; set; }
        public string SeasonID { get; set; }
        public string EpisodeID { get; set; }
        public string Members { get; set; }
        public double CurrentTime { get; set; }
        public int IsPlaying { get; set; }
        public int AllowMutualControl { get; set; }
    }

    public class RoomMember
    {
        public string Username { get; set; }
        public bool IsHost { get; set; }
        public bool IsBlocked { get; set; }
    }
}