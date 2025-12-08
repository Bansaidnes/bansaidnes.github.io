namespace BanHostAPI
{
    public class User
    {
        public int id { get; set; }
        public string username { get; set; }
        public string passwordHash { get; set; }
        public string token { get; set; }
    }
}
