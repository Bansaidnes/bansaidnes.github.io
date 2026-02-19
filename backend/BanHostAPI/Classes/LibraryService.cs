using Amazon.S3;
using Amazon.S3.Model;
using BanHostAPI.Classes;

namespace BanHostAPI.Services
{
    public class LibraryService
    {
        private readonly IAmazonS3 _s3Client;
        private const string BUCKET_NAME = "bancdn";

        private const string S3_ENDPOINT = "https://lon1.digitaloceanspaces.com";

        private const string CDN_URL = "https://access.cdn.bansaidn.es";

        public LibraryService()
        {
            var accessKey = "<Redacted>";
            var secretKey = "<Redacted>";

            var config = new AmazonS3Config
            {
                ServiceURL = S3_ENDPOINT 
            };
            _s3Client = new AmazonS3Client(accessKey, secretKey, config);
        }

        public async Task<List<ShowSummary>> GetLibraryAsync()
        {
            var shows = new List<ShowSummary>();

            try
            {
                var request = new ListObjectsV2Request
                {
                    BucketName = BUCKET_NAME,
                    Prefix = "Shows/",
                    Delimiter = "/"
                };

                var response = await _s3Client.ListObjectsV2Async(request);

                foreach (var prefix in response.CommonPrefixes)
                {
                    var folderName = prefix.TrimEnd('/').Split('/').Last();
                    if (string.IsNullOrEmpty(folderName)) continue;

                    shows.Add(new ShowSummary
                    {
                        Id = folderName,
                        Title = folderName,
                        IsSeries = true,
                        BannerUrl = $"/Library/Banner/{folderName}"
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching library: {ex.Message}");
            }

            return shows;
        }

        public async Task<ShowDetails> GetShowDetailsAsync(string showId)
        {
            var details = new ShowDetails
            {
                Id = showId,
                Title = showId,
                BannerUrl = $"/Library/Banner/{showId}",
                IsSeries = false
            };

            try
            {
                var request = new ListObjectsV2Request
                {
                    BucketName = BUCKET_NAME,
                    Prefix = $"Shows/{showId}/"
                };

                var response = await _s3Client.ListObjectsV2Async(request);
                var allFiles = response.S3Objects;

                var seasonGroups = allFiles
                    .Where(x => x.Key.Contains("/Season "))
                    .Select(x =>
                    {
                        var parts = x.Key.Split('/');
                        return parts.Length > 3 ? parts[2] : null;
                    })
                    .Where(x => x != null)
                    .Distinct()
                    .OrderBy(s => s)
                    .ToList();

                if (seasonGroups.Any())
                {
                    details.IsSeries = true;
                    foreach (var seasonName in seasonGroups)
                    {
                        var season = new Season { Id = seasonName, Name = seasonName };

                        var episodes = allFiles
                            .Where(x => x.Key.Contains($"/{seasonName}/") && x.Key.EndsWith(".mp4"))
                            .Select(x => Path.GetFileNameWithoutExtension(x.Key))
                            .Where(x => int.TryParse(x, out _))
                            .OrderBy(x => int.Parse(x))
                            .ToList();

                        season.Episodes.AddRange(episodes);
                        details.Seasons.Add(season);
                    }
                }
                else
                {
                    bool hasMovieFile = allFiles.Any(x => x.Key.EndsWith($"Shows/{showId}/1.mp4"));
                    if (hasMovieFile) details.IsSeries = false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error details: {ex.Message}");
                return null;
            }

            return details;
        }
        public (string season, string episode, double time) GetStartPoint(string userToken, string showId)
        {
            var progress = SqliteAccess.GetUserProgress(userToken, showId);
            if (progress != null) return (progress.SeasonID, progress.EpisodeID, progress.Timestamp);
            return (null, "1", 0);
        }

        public string GetBannerPath(string showId)
        {
            return $"{CDN_URL}/Shows/{showId}/banner.jpg";
        }
    }
}