namespace BanHostAPI.Classes
{
    public class UserProgress
    {
        public string UserToken { get; set; } 
        public string Username { get; set; }  
        public string ShowID { get; set; }
        public string SeasonID { get; set; }
        public string EpisodeID { get; set; }
        public double Timestamp { get; set; }
        public string LastUpdated { get; set; }
    }
}