// import { InlineKeyboard } from "grammy";
// import { raids } from "../utils/raids.js";
import { formatRaid } from "../utils/formatRaid.js";
import { findGymByKeywords } from "../utils/gyms.js";
import { raidKeyboard } from "../utils/keyboards.js";

import { fetchBosses } from '../ScrapedDuck/ScrapedDuck-mio.js';
import { raids, raidMessageMap } from '../bot.js';

export function raidCommand(bot) {
  bot.command("raid", async (ctx) => {
    // fetchBosses();

    const args = ctx.match?.split(" ") || [];

    if (args.length < 3) {
      //                            0         1           2           3           4
      return ctx.reply("Uso: /raid [pokemon] [palestra] [ora inizio] [ora fine?] [note?]");
    }

    const pokemon = args[0] || "";
    // const palestraWords = args[1];
    const palestraInfo = findGymByKeywords(args[1]);
    const palestra = palestraInfo.nome;
    const coordinates = palestraInfo.coords;
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const start = args[2] && timePattern.test(args[2]) ? args[2] : new Date().toTimeString().slice(0,5); // ora attuale HH:MM (primi 5 caratteri)
    let end = "";
    let notes = "";
    if (args[3] && timePattern.test(args[3])) {
      end = args[3];
      notes = args.slice(4).join(" ");
    } else {
      notes = args.slice(3).join(" ");
    }


    if (!palestraInfo) return ctx.reply("Nome palestra errato, riprova con un nuovo comando.");

    const raidId = Math.floor(Math.random() * 1000000).toString();
    const raid = {
      id: raidId,
      pokemon,
      palestra,
      coordinates,
      start,
      end,
      notes,
      creator: ctx.from?.first_name || "Sconosciuto",
      players: [],
      };

    addRaid(bot, ctx, raid);

    const sendMessage = await ctx.reply(await formatRaid(raid), { 
      reply_markup: raidKeyboard(raidId),
      parse_mode: "Markdown",
      disable_web_page_preview: true
    });
    
    raidMessageMap.set(raidId, sendMessage.message_id);
    console.log(`Associato Raid ${raidId} al messaggio ${sendMessage.message_id}`);
  });
}

function addRaid(bot, ctx, raid) {
  raids.set(raid.id, raid);

  // Calcolo timeout
  const [hours, minutes] = raid.end.split(":").map(Number); // raid.end = "15:30"
  let delay;

  if (raid.end) {
    const now = new Date();
    const endTime = new Date(
      now.getFullYear(),  // anno di oggi
      now.getMonth(),     // mese di oggi (0-11)
      now.getDate(),      // giorno di oggi
      hours,              // ora che vuoi
      minutes,            // minuti che vuoi
      0,                  // secondi
      0                   // millisecondi
    );
    delay = endTime.getTime() - now.getTime();
  }

  // Se non c'è end o end è passato, imposta 6 ore di default
  if (!delay || delay <= 0) {
    delay = 6 * 60 * 60 * 1000; // 6 ore in ms
  }

  // Imposta timeout per distruggere il raid
  raid.timeout = setTimeout(async () => {
    clearInterval(raid.interval); // fermiamo il log
    await closeRaid(bot, ctx, raid);
  }, delay);

  // Ogni 30 secondi mostra quanto manca
  // raid.interval = setInterval(() => {
  //   const now = new Date().getTime();
  //   const remaining = delay - (now - raid.createdAt);

  //   if (remaining <= 0) {
  //     clearInterval(raid.interval);
  //   } else {
  //     const minutesLeft = Math.floor(remaining / 60000);
  //     const secondsLeft = Math.floor((remaining % 60000) / 1000);
  //     console.log(
  //       `Raid ${raid.id}: rimangono ${minutesLeft}m ${secondsLeft}s`
  //     );
  //   }
  // }, 10 * 1000);

  // Salviamo anche l'istante di creazione per i calcoli
  raid.createdAt = new Date().getTime();
}

function updateRaidEnd(raidId, newEnd) {
  const raid = raids.get(raidId);
  if (!raid) return;

  // Cancella timeout precedente
  if (raid.timeout) clearTimeout(raid.timeout);

  raid.end = newEnd;

  // Imposta nuovo timeout
  addRaid(raid);
}

async function closeRaid(bot, ctx, raid) {
  const raidMsgId = raidMessageMap.get(raid.id);
  if (!raidMsgId) return;

  // Se c’è un timeout attivo, lo puliamo
  // if (raid.timeout) {
  //   clearTimeout(raid.timeout);
  // }

    // Rimuovi il messaggio Telegram se esiste
  if (raidMsgId) {
    try {
      // await ctx.deleteMessage();
      await bot.api.deleteMessage(ctx.chatId, raidMsgId);
    } catch (err) {
      console.log("Errore eliminando messaggio:", err.description || err);
    }
  }

  raids.delete(raid.id);
  console.log(`Raid ${raid.id} chiuso`);
  // Qui puoi anche aggiornare il messaggio su Telegram
}
