// Importa le librerie necessarie
import dotenv from 'dotenv';

import { Bot } from "grammy";
// import { Message } from "grammy/types";
// import bosses from './ScrapedDuck/boss-names.json' assert { type: 'json' };
// import ScrapedDuck from 'ScrapedDuck';

import { noteCommand } from "./commands/note.js";
import { raidCommand } from "./commands/raid.js";
import { raidsCommand } from "./commands/raids.js";
import { tagCommand } from "./commands/tag.js";
import { infoCommand } from "./commands/info.js";

import { callback } from "./utils/callback.js";
import { readGoogleSheet } from "./utils/gyms.js";
import { listenerCommands } from "./utils/listenerCommands.js";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

// Leggi il JSON
// const rawData = fs.readFileSync('./ScrapedDuck/boss-names.json', 'utf-8');
// const bosses = JSON.parse(rawData);

// Prima di far partire il bot, carica le palestre
await readGoogleSheet();

const isProduction = process.env.NODE_ENV === 'production';
let bot;
if (isProduction) {
    bot = new Bot(process.env.BOT_TOKEN);
    bot.setWebHook('https://pokemongoraid-bot.on.shiper.app/' + process.env.BOT_TOKEN);
    console.log('Bot avviato in modalità webhook (production)');
} else {
    bot = new Bot(process.env.BOT_TOKEN, { polling: true });
    console.log('Bot avviato in modalità polling (development)');
}

const allowedUsers = [471651426];
const allowedGroups = [-4915341478];
bot.use(async (ctx, next) => {
  if (!isProduction) {
    if (!allowedUsers.includes(ctx.from.id) || !allowedGroups.includes(ctx.chat.id)) return; // filtra
  }
  await next(); // passa al prossimo handler (comando, message, ecc.)
});

export const raids = new Map();           // Struttura dei raid memorizzati in memoria
export const raidMessageMap = new Map();	// Dizionario per associare raid ID -> Telegram message ID
export const commands = ["raid", "raids", "info", "tag"];

// COMANDI del bot
await listenerCommands(bot);
raidCommand(bot);
raidsCommand(bot);
tagCommand(bot);
noteCommand(bot);
callback(bot);
infoCommand(bot);

bot.command("d", async (ctx) => {
  if (!ctx.message?.reply_to_message) {
    return ctx.reply("❌ Devi rispondere a un messaggio con /d per eliminarlo.");
  }

  const repliedMessageId = ctx.message.reply_to_message.message_id;

  try {
    // Elimina il messaggio a cui l'utente ha risposto
    await ctx.api.deleteMessage(ctx.chat.id, repliedMessageId);

    // Elimina anche il comando /delete
    await ctx.deleteMessage();

    // Manda un messaggio di conferma
    await ctx.reply(`✅ Messaggio con ID ${repliedMessageId} eliminato con successo.`);
  } catch (err) {
    console.error("Errore:", err);
    await ctx.reply("⚠️ Non sono riuscito a eliminare quel messaggio. Forse non ho i permessi?");
  }
});

bot.command("delete", async (ctx) => {
    const args = ctx.match?.split(" ") || [];
    if (args.length < 1) {
        return ctx.reply("Uso: /delete [ID del raid]");
    }
    const raidId = args[0];
    const raid = raids.get(raidId);
    if (!raid) {
        return ctx.reply("Raid non trovato!");
    }
	const raidMessageId = raid.message_id;

    // Prova a cancellare il messaggio del raid
    try {
        await ctx.api.deleteMessage(ctx.chat.id, raidMessageId);
    } catch (err) {
        console.error("Errore cancellazione messaggio:", err);
    	await ctx.reply("Errore durante la cancellazione del messaggio: " + err.description);
    }

    raids.delete(raidId);
    await ctx.reply(`Raid ${raidId} eliminato con successo.`);
});

bot.start({ drop_pending_updates: true });
console.log("Bot avviato!");