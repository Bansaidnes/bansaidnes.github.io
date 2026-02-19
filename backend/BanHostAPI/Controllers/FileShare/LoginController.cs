using BanHostAPI.Classes;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace BanHostAPI.Controllers
    {
        [Route("[controller]")]
        [ApiController]
        public class LoginController : ControllerBase
        {
        [HttpGet]
        public IActionResult Login(string username, string password)
        {
            User user;
            try
            {
                user = SqliteAccess.Query("Username", username);
            }
            catch (Exception e) { return BadRequest($"Unable to find user!\n{e.Message}"); }
            if (user.passwordHash == Encrypt.hashPassword(password))
            {
                user.passwordHash = "<HIDDEN>";
                return Ok(user);
            }
            else return BadRequest("Incorrect password");
            }
        }
    }
