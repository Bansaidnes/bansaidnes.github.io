using Microsoft.AspNetCore.Mvc;

namespace BanHostAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class FileDeleteController : Controller
    {
        [HttpGet]
        public IActionResult Get(string id, string token)
        {
            BanFile bfile = SqliteAccess.FileQuery("ID", id).First();
            if (bfile.owner == token)
            {
                SqliteAccess.DeleteRecord("Files", bfile.id);
                System.IO.File.Delete(bfile.filepath);
                return Ok("File deleted!");
            }
            else return BadRequest("Token does not match file owner");

        }
    }
}
