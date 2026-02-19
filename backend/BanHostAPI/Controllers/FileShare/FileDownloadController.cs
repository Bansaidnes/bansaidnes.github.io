using BanHostAPI.Classes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace BanHostAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class FileDownloadController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get(string id, string token)
        {
            BanFile bfile = SqliteAccess.FileQuery("ID", id).First();
            if (bfile.owner == token) return File(System.IO.File.ReadAllBytes(bfile.filepath), "application/octet-stream", bfile.filename);
            else return BadRequest("Token does not match file owner");
        }
    }
}
