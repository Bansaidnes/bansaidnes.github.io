using Microsoft.AspNetCore.Mvc;

namespace BanHostAPI.Controllers.Misc
{
    [Route("[controller]")]
    [ApiController]
    public class VPNController : Controller
    {
        [HttpPost]
        public IActionResult SignUp()
        {
            return Ok("");
        }
    }
}
