using Microsoft.AspNetCore.Mvc;

namespace BanHostAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class FileUpController : ControllerBase
    {
        private readonly IWebHostEnvironment hostEnv;
        public FileUpController(IWebHostEnvironment hostEnv) { this.hostEnv = hostEnv; }
        [HttpPost]
        [DisableRequestSizeLimit]
        [RequestFormLimits(MultipartBodyLengthLimit = 1_000_000_000_000)]
        public IActionResult FileReceived(List<IFormFile> files, string token)
        {
            bool isTokenValid = true;
            if (files.Count == 0) return NoContent();
            string destFolder = Path.Combine(hostEnv.ContentRootPath, $"ReceivedFiles/{token.Replace("/", "").Replace("\\", "")}");
            if(!Directory.Exists(destFolder)) Directory.CreateDirectory(destFolder);
            User user;
            try { user = SqliteAccess.Query("Token", token); } 
            catch(Exception e)
            {
                return NotFound($"Unknown token\n{e.Message}");
                isTokenValid = false;
            }
            if (isTokenValid)
            {
                List<BanFile> banfiles = new List<BanFile>();
                foreach (var file in files)
                {
                    string fileName = file.FileName;
                    string filePath = Path.Combine(destFolder, file.FileName);
                    if (System.IO.File.Exists(filePath))
                    {
                        int count = 1;
                        while (System.IO.File.Exists(filePath))
                        {
                            fileName = $"({count}){file.FileName}";
                            filePath = Path.Combine(destFolder, fileName);
                            count++;
                        }
                    }
                    using (var filestream = new FileStream(filePath, FileMode.Create)) file.CopyTo(filestream);
                    BanFile bfile = new BanFile();

                    bfile.ispublic = "false";
                    bfile.filepath = filePath;
                    bfile.filename = fileName;
                    bfile.owner = token;
                    bfile.id = Encrypt.IdGen();
                    SqliteAccess.RegisterFile(bfile);
                    banfiles.Add(bfile);
                }
                return Ok(banfiles);
            } else return BadRequest(); 
        }
    }
}
