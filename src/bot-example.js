import { Bot } from "grammy";

// Create a bot object
const bot = new Bot("8194359742:AAFG3gxCWPKjiOkQCpxUKBRplr2HciDoP0E"); // <-- place your bot token in this string

// Register listeners to handle messages
//bot.on("message:text", async (ctx) => await ctx.reply("Echo: " + ctx.message.text));

// Handle the /start command.
bot.command("start", async (ctx) => await ctx.reply("Welcome! Up and running."));

// Handle the /raid command.
bot.command("raid", async (ctx) => await ctx.reply("Initializing raid..."));

// bot.on("message:text", async (ctx) => {
//   // Se il messaggio è in un gruppo e contiene testo
//   if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
//     if (ctx.message.text) {
//       await ctx.reply(ctx.message.text, {
//         reply_to_message_id: ctx.message.message_id, // risponde direttamente
//       });
//     }
//   }
// });

// Start the bot (not using long polling)
bot.start({
  drop_pending_updates: true,
});

