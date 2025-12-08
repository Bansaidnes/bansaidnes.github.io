using Microsoft.AspNetCore.Mvc;

namespace BanHostAPI.Controllers.Clipping
{
    [Route("[controller]")]
    [ApiController]
    public class clipInfo : Controller
    {
        [HttpGet]
        public IActionResult _clipInfo(String ID)
        {
            try
            {
                return Ok(SqliteAccess.GetClipInfo(ID));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
