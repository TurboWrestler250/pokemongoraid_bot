import { getConnection, query } from "../database.js";

export async function database(bot) {
  bot.command("database", async (ctx) => {
    const sql = "SELECT DATABASE();";
    console.log("dentro il comando database");
    try {
      // await getConnection();
      console.log('Connecting to:', process.env.DB_HOST);
      const [rows] = await query(sql);
      console.log("Righe: " + rows);
      // console.log(fields);
      await ctx.reply("Ecco la connessione al database:");
      await ctx.reply(rows);
    } catch (err) {
      console.error(err);
    }
  });
}