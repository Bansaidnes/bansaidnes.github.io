using System.Text;
using System.Security.Cryptography;

namespace BanHostAPI
{
    public class Encrypt
    {
        public static string hashPassword(string pw)
        {
            StringBuilder sb = new StringBuilder();
            foreach(byte b in hashPasswordBytes(pw)) sb.Append(b.ToString("X3"));
            return sb.ToString();
        }
        public static byte[] hashPasswordBytes(string pw)
        {
            using (HashAlgorithm algorithm = SHA256.Create())
                return algorithm.ComputeHash(Encoding.UTF8.GetBytes(pw));
        }
        public static string tokenGen(User user)
        {
            Random rnd = new Random();
            char[] elements = {'+', '-', '_', '=', ';', ':', '<', '>', '.', ',', '?'};
            string securechars = "+-_-";
            for(int i = 0; i < 2; i++) securechars += elements[rnd.Next(elements.Length)];
            string _base = user.username + user.id + securechars;
            var bytes = Encoding.UTF8.GetBytes(_base);
            return Convert.ToBase64String(bytes);
        }
        public static int IdGen()
        {
            Random rnd = new Random();
            int id = rnd.Next(1000000, 100000000);
            return id;
        }
    }
}
