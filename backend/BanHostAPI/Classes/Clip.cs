namespace BanHostAPI
{
    public class Clip
    {
        public string ID { get; set; }
        public string Name { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public string? OwnerToken { get; set; }
    }
}