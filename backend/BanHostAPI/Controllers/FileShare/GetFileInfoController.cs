using BanHostAPI.Classes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace BanHostAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class GetFileInfoController : ControllerBase
    {
        [HttpGet]
        public IActionResult E(string id)
        {
            BanFile file = SqliteAccess.FileQuery("ID", id).First();
            file.owner = "<HIDDEN>";
            file.filepath = "<HIDDEN>";
            return Ok(file);
        }
    }
}
