using System.Text.Json.Serialization;

namespace BanHostAPI.Classes
{
    public class ShowSummary
    {
        public string Id { get; set; }        
        public string Title { get; set; }    
        public bool IsSeries { get; set; }    
        public string BannerUrl { get; set; } 
    }

    public class ShowDetails : ShowSummary
    {
        public List<Season> Seasons { get; set; } = new List<Season>();
    }

    public class Season
    {
        public string Id { get; set; }  
        public string Name { get; set; }
        public List<string> Episodes { get; set; } = new List<string>(); 
    }
}