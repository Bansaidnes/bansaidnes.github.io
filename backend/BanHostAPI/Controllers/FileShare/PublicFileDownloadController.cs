using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace BanHostAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class PublicFileDownloadController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetFile(string id)
        {
            BanFile bfile = SqliteAccess.FileQuery("ID", id).First();
            if (bfile.ispublic == "true")
            {
                return File(System.IO.File.ReadAllBytes(bfile.filepath), "application/octet-stream", bfile.filename);
                return Ok();
            }
            else return BadRequest("File is private >:C");
        }
    }
}
