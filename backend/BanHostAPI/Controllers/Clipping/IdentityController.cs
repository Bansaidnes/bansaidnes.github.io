using Microsoft.AspNetCore.Mvc;

namespace BanHostAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class IdentityController : ControllerBase
    {
        [HttpGet("init")]
        public IActionResult GetIdentity()
        {
            return Ok(new { token = Guid.NewGuid().ToString("N") });
        }
    }
}