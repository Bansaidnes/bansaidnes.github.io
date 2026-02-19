using BanHostAPI.Classes;
using Dapper;
using System.Data;
using System.Data.SQLite;
using System.Drawing;

namespace BanHostAPI
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
            {
                con.Execute("insert into Clips (ID, Name, Width, Height, OwnerToken) values (@ID, @Name, @Width, @Height, @OwnerToken)", clip);
            }
        }

        public static List<Clip> GetClipsByOwner(string ownerToken)
        {
            using (IDbConnection con = new SQLiteConnection(src))
            {
                var output = con.Query<Clip>("SELECT * FROM Clips WHERE OwnerToken = @Token", new { Token = ownerToken });
                return output.ToList();
            }
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
        // BanWatch
        public static void CreateWatchRoom(WatchRoom room)
        {
            using (IDbConnection con = new SQLiteConnection(src))
            {
                string query = @"
                            INSERT INTO WatchRoom (
                                HostToken, RoomID, RoomName, ShowID, SeasonID, EpisodeID, 
                                Members, CurrentTime, IsPlaying, AllowMutualControl
                            ) 
                            VALUES (
                                @HostToken, @RoomID, @RoomName, @ShowID, @SeasonID, @EpisodeID, 
                                @Members, @CurrentTime, @IsPlaying, @AllowMutualControl
                            )";
                con.Execute(query, room);
            }
        }

        public static WatchRoom GetWatchRoom(string roomID)
        {
            using (IDbConnection con = new SQLiteConnection(src))
            {
                var output = con.Query<WatchRoom>("SELECT * FROM WatchRoom WHERE RoomID = @RoomID", new { RoomID = roomID });
                return output.FirstOrDefault();
            }
        }

        public static void UpdateRoomMembers(string roomID, string membersJson)
        {
            using (IDbConnection con = new SQLiteConnection(src))
            {
                con.Execute("UPDATE WatchRoom SET Members = @Members WHERE RoomID = @RoomID", new { Members = membersJson, RoomID = roomID });
            }
        }

        public static void UpdateRoomState(string roomID, double currentTime, bool isPlaying)
        {
            using (IDbConnection con = new SQLiteConnection(src))
            {
                con.Execute("UPDATE WatchRoom SET CurrentTime = @Time, IsPlaying = @Playing WHERE RoomID = @RoomID",
                    new { Time = currentTime, Playing = isPlaying ? 1 : 0, RoomID = roomID });
            }
        }

        public static void RemoveRoomMember(string roomId, string username)
        {
            using (IDbConnection con = new SQLiteConnection(src))
            {
                var room = con.Query<WatchRoom>("SELECT * FROM WatchRoom WHERE RoomID = @RoomID", new { RoomID = roomId }).FirstOrDefault();
                if (room != null)
                {
                    var members = System.Text.Json.JsonSerializer.Deserialize<List<RoomMember>>(room.Members) ?? new List<RoomMember>();
                    var userToRemove = members.FirstOrDefault(m => m.Username == username);

                    if (userToRemove != null)
                    {
                        members.Remove(userToRemove);
                        string jsonMembers = System.Text.Json.JsonSerializer.Serialize(members);

                        con.Execute("UPDATE WatchRoom SET Members = @Members WHERE RoomID = @RoomID", new { Members = jsonMembers, RoomID = roomId });
                    }
                }
            }
        }
        public static void UpdateRoomVideo(string roomId, string showId, string seasonId, string episodeId)
        {
            using (IDbConnection con = new SQLiteConnection(src))
            {
                string query = @"
            UPDATE WatchRoom 
            SET ShowID = @ShowID, SeasonID = @SeasonID, EpisodeID = @EpisodeID, CurrentTime = 0, IsPlaying = 1 
            WHERE RoomID = @RoomID";

                con.Execute(query, new { ShowID = showId, SeasonID = seasonId, EpisodeID = episodeId, RoomID = roomId });
            }
        }
        public static void SaveUserProgress(UserProgress prog)
        {
            using (IDbConnection con = new SQLiteConnection(src))
            {
                string query = @"
            INSERT OR REPLACE INTO UserProgress (UserToken, Username, ShowID, SeasonID, EpisodeID, Timestamp, LastUpdated)
            VALUES (@UserToken, @Username, @ShowID, @SeasonID, @EpisodeID, @Timestamp, @LastUpdated)";
                con.Execute(query, prog);
            }
        }
        public static UserProgress GetUserProgress(string userToken, string showId)
        {
            using (IDbConnection con = new SQLiteConnection(src))
            {
                return con.QueryFirstOrDefault<UserProgress>(
                    "SELECT * FROM UserProgress WHERE UserToken = @UserToken AND ShowID = @ShowID",
                    new { UserToken = userToken, ShowID = showId });
            }
        }

        public static void DeleteRoom(string roomId)
        {
            using (IDbConnection con = new SQLiteConnection(src))
            {
                con.Execute("DELETE FROM WatchRoom WHERE RoomID = @RoomID", new { RoomID = roomId });
            }
        }

        public static void UpdateRoomHost(string roomId, string newHostToken, string membersJson)
        {
            using (IDbConnection con = new SQLiteConnection(src))
            {
                string query = "UPDATE WatchRoom SET HostToken = @HostToken, Members = @Members WHERE RoomID = @RoomID";
                con.Execute(query, new { HostToken = newHostToken, Members = membersJson, RoomID = roomId });
            }
        }
    }
}
