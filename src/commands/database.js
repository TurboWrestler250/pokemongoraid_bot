import { getConnection, query } from "../database.js";

export async function database(bot) {
  bot.command("database", async (ctx) => {
    const sql = "SELECT DATABASE();";
    console.log("dentro il comando database");
    try {
      // await getConnection();
      console.log('Connecting to:', process.env.DB_HOST);
      console.log('Connecting to:', process.env.DB_PORT);
      console.log('Connecting to:', process.env.DB_USER);
      console.log('Connecting to:', process.env.DB_PASSWORD);
      console.log('Connecting to:', process.env.DB_NAME);
      const [rows] = await query(sql);
      console.log("Righe: " + rows);
      // console.log(fields);
      ctx.reply("Ecco la connessione al database:");
      ctx.reply(rows);
    } catch (err) {
      console.error(err);
    }
  });
}