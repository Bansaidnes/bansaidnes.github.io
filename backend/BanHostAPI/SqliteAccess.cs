using Dapper;
using System.Data;
using System.Data.SQLite;
using System.Drawing;

namespace BanHostAPI.Controllers
{
    public class SqliteAccess
    {
        private static string src = "Data Source=BanHostDB.db;Version = 3;";
        public static User Query(string field, string query)
        {
            using (IDbConnection con = new SQLiteConnection(src))
            {
                DynamicParameters obj = new DynamicParameters();
                obj.Add("query", query);
                var output = con.Query<User>($"select * from User WHERE {field} = @query", obj);
                List<User> users = output.ToList();
                User user = users.First();
                return user;
            }
        }
        public static List<BanFile> FileQuery(string field, string query)
        {
            using (IDbConnection con = new SQLiteConnection(src))
            {
                DynamicParameters obj = new DynamicParameters();
                obj.Add("query", query);
                var output = con.Query<BanFile>($"select * from Files WHERE {field} = @query", obj);
                List<BanFile> files = output.ToList();
                return files;
            }
        }
        public static void RegisterFile(BanFile file)
        {
            using (IDbConnection con = new SQLiteConnection(src))
                con.Execute("insert into Files (ID, FileName, FilePath, Owner,isPublic) values (@id, @filename, @filepath, @owner, @ispublic)", file);
         }
        public static void ChangeFileVisibility(string token, string id, string newvisibility)
        {
            DynamicParameters obj = new DynamicParameters();
            obj.Add("id",id);
            obj.Add("visi", newvisibility);
            BanFile file = FileQuery("ID", id).First();
            if (file.owner == token)
                using (IDbConnection con = new SQLiteConnection(src))
                    con.Execute($"UPDATE Files SET isPublic = @visi WHERE ID = @id", obj);
        }
        public static void DeleteRecord(string table, int id)
        {
            DynamicParameters obj = new DynamicParameters();
            obj.Add("table", table);
            obj.Add("id", id);
            using (IDbConnection con = new SQLiteConnection(src))
                con.Execute($"DELETE FROM @table WHERE ID = @id", obj);
        }
        public static void SaveUser(User user)
        {
            using (IDbConnection con = new SQLiteConnection(src))
                con.Execute("insert into User (Token, Username, PasswordHash) values (@token, @username, @passwordHash)", user);
        }
        //URLs
        public static string GetUrl(string Token)
        {
            using (IDbConnection con = new SQLiteConnection(src))
            {
                DynamicParameters obj = new DynamicParameters();
                obj.Add("query", Token);
                var output = con.Query<Shortened>($"select * from RedirectTokens WHERE Token = @query", obj);
                List<Shortened> shorte = output.ToList();
                if (shorte.Count > 0)
                {
                    Shortened shortee = shorte.First();
                    return (shortee.RedUrl);
                }
                else return ("https://bansaidnes.me");
            }
        }
        public static void SaveShort(Shortened newShort)
        {
            using (IDbConnection con = new SQLiteConnection(src))
                con.Execute("insert into RedirectTokens (Token, RedUrl) values (@Token, @RedUrl)", newShort);
        }
        //Clips
        public static void SaveClipInfo(Clip clip)
        {    
            using (IDbConnection con = new SQLiteConnection(src))
                con.Execute("insert into Clips (ID, Name, Width, Height) values (@ID, @Name, @Width, @Height)", clip);
        }
        public static Clip GetClipInfo(String ID)
        {
            using (IDbConnection con = new SQLiteConnection(src))
            {
                DynamicParameters obj = new DynamicParameters();
                obj.Add("ID", ID);
                var output = con.Query<Clip>($"select * from Clips WHERE ID = @ID", obj);
                List<Clip> clips = output.ToList();
                Clip clip = clips.First();
                return clip;
            }
        }
    }
}
