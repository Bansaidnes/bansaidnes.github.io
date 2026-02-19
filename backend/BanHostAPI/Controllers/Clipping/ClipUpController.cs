using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text.RegularExpressions;

namespace BanHostAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ClipUpController : Controller
    {
        private readonly IWebHostEnvironment hostEnv;

        private const string BucketName = "bancdn"; 
        private const string ServiceUrl = "https://lon1.digitaloceanspaces.com";
        private const string AccessKey = "<Redacted>";
        private const string SecretKey = "<Redacted>";

        public ClipUpController(IWebHostEnvironment hostEnv)
        {
            this.hostEnv = hostEnv;
        }

        [HttpPost]
        [DisableRequestSizeLimit]
        [RequestFormLimits(MultipartBodyLengthLimit = 524_288_000)]
        public async Task ClipUp([FromForm] List<IFormFile> clip, [FromForm] string? name, [FromForm] string? ownerToken)
        {
            Response.Headers.Append("Content-Type", "text/event-stream");
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("Connection", "keep-alive");
            Response.Headers.Append("X-Accel-Buffering", "no");
            Response.Headers.Append("Content-Encoding", "none");

            string workFolder = Path.Combine(hostEnv.ContentRootPath, "Clips", "Temp");
            Directory.CreateDirectory(workFolder);

            string finalId = "";

            foreach (var file in clip)
            {
                finalId = GenerateID();

                string originalPath = Path.Combine(workFolder, finalId + "_raw.mp4");
                string compressedPath = Path.Combine(workFolder, finalId + ".mp4");

                while (System.IO.File.Exists(originalPath) || System.IO.File.Exists(compressedPath))
                {
                    finalId = GenerateID();
                    originalPath = Path.Combine(workFolder, finalId + "_raw.mp4");
                    compressedPath = Path.Combine(workFolder, finalId + ".mp4");
                }

                using (var filestream = new FileStream(originalPath, FileMode.Create))
                {
                    await file.CopyToAsync(filestream);
                }

                await Response.WriteAsync($"event: status\ndata: Uploading original...\n\n");
                await Response.Body.FlushAsync();

                try
                {
                    await UploadToCdn(originalPath, $"Clips/{finalId}.mp4");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Original Upload Failed: {ex.Message}");
                }

                await compressVideo(originalPath, compressedPath);

                await Response.WriteAsync($"event: status\ndata: Uploading compressed...\n\n");
                await Response.Body.FlushAsync();

                try
                {
                    await UploadToCdn(compressedPath, $"Clips/Compressed/{finalId}.mp4");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Compressed Upload Failed: {ex.Message}");
                    await Response.WriteAsync($"event: error\ndata: CDN Upload failed\n\n");
                    return;
                }

                try
                {
                    var (width, height) = GetVideoMetadata(compressedPath);
                    string clipName = string.IsNullOrWhiteSpace(name) ? file.FileName : name;

                    var newClip = new Clip
                    {
                        ID = finalId,
                        Name = clipName,
                        Width = width,
                        Height = height,
                        OwnerToken = ownerToken
                    };

                    SqliteAccess.SaveClipInfo(newClip);

                    if (System.IO.File.Exists(originalPath)) System.IO.File.Delete(originalPath);
                    if (System.IO.File.Exists(compressedPath)) System.IO.File.Delete(compressedPath);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Metadata/Cleanup Error: {ex.Message}");
                }
            }

            string finalPayload = $"{{\"id\": \"{finalId}\"}}";
            await Response.WriteAsync($"event: complete\n");
            await Response.WriteAsync($"data: {finalPayload}\n\n");
            await Response.Body.FlushAsync();
        }

        private async Task UploadToCdn(string filePath, string key)
        {
            var credentials = new BasicAWSCredentials(AccessKey, SecretKey);
            var config = new AmazonS3Config { ServiceURL = ServiceUrl };

            using (var client = new AmazonS3Client(credentials, config))
            {
                var utility = new TransferUtility(client);

                var request = new TransferUtilityUploadRequest
                {
                    BucketName = BucketName,
                    Key = key,
                    FilePath = filePath,
                    CannedACL = S3CannedACL.PublicRead
                };

                await utility.UploadAsync(request);
            }
        }
        private (int width, int height) GetVideoMetadata(string filePath)
        {
            var process = new Process();
            process.StartInfo.FileName = "ffprobe";
            process.StartInfo.Arguments = $"-v error -select_streams v:0 -show_entries stream=width,height -of csv=s=,:p=0 \"{filePath}\"";
            process.StartInfo.UseShellExecute = false;
            process.StartInfo.RedirectStandardOutput = true;
            process.StartInfo.CreateNoWindow = true;
            process.Start();

            string output = process.StandardOutput.ReadToEnd();
            process.WaitForExit();

            if (!string.IsNullOrWhiteSpace(output))
            {
                var parts = output.Trim().Split(',');
                if (parts.Length >= 2 &&
                    int.TryParse(parts[0], out int w) &&
                    int.TryParse(parts[1], out int h))
                {
                    return (w, h);
                }
            }

            return (0, 0);
        }

        private async Task compressVideo(string inputPath, string outputPath)
        {
            long inputSizeBytes = new FileInfo(inputPath).Length;
            long targetSizeBytes = 80 * 1024 * 1024;

            if (inputSizeBytes < targetSizeBytes)
            {
                System.IO.File.Copy(inputPath, outputPath, true);

                await Response.WriteAsync("data: 100\n\n");
                await Response.Body.FlushAsync();
                return;
            }

            double durationSeconds = 0;
            var probeProcess = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "ffmpeg",
                    Arguments = $"-i \"{inputPath}\"",
                    UseShellExecute = false,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                }
            };

            probeProcess.Start();
            string probeOutput = await probeProcess.StandardError.ReadToEndAsync();
            await probeProcess.WaitForExitAsync();

            var durationMatch = Regex.Match(probeOutput, @"Duration:\s(\d{2}:\d{2}:\d{2}\.\d{2})");
            if (durationMatch.Success && TimeSpan.TryParse(durationMatch.Groups[1].Value, out TimeSpan duration))
            {
                durationSeconds = duration.TotalSeconds;
            }

            if (durationSeconds <= 0) durationSeconds = 60;

            const double targetSizeBits = 80.0 * 1024 * 1024 * 8;
            const int audioBitrateKbps = 128;

            double totalBitrateKbps = (targetSizeBits / durationSeconds) / 1024;

            int videoBitrateKbps = (int)(totalBitrateKbps - audioBitrateKbps);

            if (videoBitrateKbps < 50) videoBitrateKbps = 50;
            if (videoBitrateKbps > 5000) videoBitrateKbps = 5000;

            var process = new Process();
            process.StartInfo.FileName = "ffmpeg";

            process.StartInfo.Arguments = $"-y -i \"{inputPath}\" " +
                                          $"-c:v libx264 -b:v {videoBitrateKbps}k -maxrate {videoBitrateKbps}k -bufsize {videoBitrateKbps * 2}k " +
                                          $"-preset ultrafast -movflags +faststart " +
                                          $"-c:a aac -b:a {audioBitrateKbps}k " +
                                          $"\"{outputPath}\"";

            process.StartInfo.UseShellExecute = false;
            process.StartInfo.RedirectStandardError = true;
            process.StartInfo.CreateNoWindow = true;
            process.Start();

            using (StreamReader reader = process.StandardError)
            {
                string line;
                TimeSpan totalDurationSpan = TimeSpan.FromSeconds(durationSeconds);

                while (!process.HasExited)
                {
                    line = await reader.ReadLineAsync();
                    if (line == null) break;

                    var timeMatch = Regex.Match(line, @"time=(\d{2}:\d{2}:\d{2}\.\d{2})");
                    if (timeMatch.Success && totalDurationSpan.TotalSeconds > 0)
                    {
                        if (TimeSpan.TryParse(timeMatch.Groups[1].Value, out TimeSpan currentTime))
                        {
                            double percentage = (currentTime.TotalSeconds / totalDurationSpan.TotalSeconds) * 100;

                            await Response.WriteAsync($"data: {percentage:F0}\n\n");
                            await Response.Body.FlushAsync();
                        }
                    }
                }
            }
            await process.WaitForExitAsync();
        }

        public static string GenerateID()
        {
            string Token = "";
            string tknchars = string.Empty;
            Enumerable.Range(48, 75)
              .Where(i => i < 58 || i > 64 && i < 91 || i > 96)
              .OrderBy(z => new Random().Next())
              .ToList()
              .ForEach(i => tknchars += Convert.ToChar(i));
            try { Token = tknchars.Substring(new Random().Next(0, tknchars.Length), new Random().Next(6, 10)); }
            catch (ArgumentOutOfRangeException) { Token = tknchars.Substring(new Random().Next(0, tknchars.Length), new Random().Next(6, 10)); }

            return Token;
        }
    }
}