import { InlineKeyboard } from "grammy";

import Raid from "../models/raid.js";
// import { raids } from "../utils/raids.js";
import { formatRaid } from "../utils/formatRaid.js";
import { findGymByKeywords } from "../utils/gyms.js";
import { raidKeyboard } from "../utils/keyboards.js";

export const raids = []; // Struttura dei raid memorizzati in memoria

// import { fetchBosses } from '../ScrapedDuck/ScrapedDuck-mio.js';

export function raidCommand(bot) {
  bot.command("raid", async (ctx) => {
    // fetchBosses();

    const args = ctx.match?.split(" ") || [];

    if (args.length < 3) {
      //                            0         1           2           3           4
      return ctx.reply("Uso: /raid [pokemon] [gym] [ora inizio] [ora fine?] [note?]");
    }

    const pokemon = args[0] || "";
    const gym = findGymByKeywords(args[1]);
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

    if (!gym) return ctx.reply("Nome palestra errato, riprova con un nuovo comando.");

    const raid = new Raid({
      pokemon:  pokemon,
      gym:      gym.nome,
      lat:      gym.lat,
      lon:      gym.lon,
      start:    start,
      end:      end,
      notes:    notes,
      creator:  ctx.from?.first_name
    });

    // addRaid(bot, ctx, raid);
    // raids.set(raid.getId(), raid);
    
    // console.log("Raid salvati:", typeof(raids), raids);
    // console.log("Raid trovato:", typeof(raids.get(raid.getId())), raids.get(raid.getId()));
    // console.log("Pokémon:", raids.get(raid.getId()).getPokemon());
    // console.log("Palestra:", raids.get(raid.getId()).getGym());
    // console.log("ID:", raids.get(raid.getId()).getId());

    console.log(`Raid creato: ${raid.getPokemon()} - ID: ${raid.getId()}`);
    scheduleRaidClose(bot, ctx, raid, timePattern);

    const sendMessage = await ctx.reply(await formatRaid(raid), { 
      reply_markup: raidKeyboard(raid.getId()),
      parse_mode: "Markdown",
      disable_web_page_preview: true
    });

    raid.setIdMessagge(sendMessage.message_id);
    raids.push(raid);
    console.log(`Associato Raid ${raid.getId()} al messaggio ${raid.getIdMessagge()}`);

    // console.log(`Raid appena creato:`, typeof(raid), raid.toJSON());
    // console.log(`Raids saltati in memoria`, typeof(raids), JSON.stringify(raids, null, 2));
  });
}

function scheduleRaidClose(bot, ctx, raid, timePattern) {
  let delay;
  
  if (raid.getTimeEnd() && timePattern.test(raid.getTimeEnd())) {
    const [hours, minutes] = raid.getTimeEnd().split(":").map(Number);
    const now = new Date();
    const endTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
      0
    );
    delay = endTime.getTime() - now.getTime();
  }

  // Se non c'è end o end è passato, imposta 6 ore di default
  if (!delay || delay <= 0) {
    delay = 6 * 60 * 60 * 1000; // 6 ore in ms
  }

  // Imposta timeout per distruggere il raid
  const timeout = setTimeout(async () => {
    await closeRaid(bot, ctx, raid);
  }, delay);

  // Salva il timeout nel raid (se vuoi poterlo cancellare in seguito)
  // Nota: non puoi salvare timeout nella classe con proprietà private
  // Considera di usare una Map esterna per i timeout
  console.log(`Raid ${raid.getId()} sarà chiuso tra ${Math.round(delay / 60000)} minuti`);
}

// function updateRaidEnd(newEnd) {
//   const raid = raids.get(raid.getId()); 
//   if (!raid) return;

//   // Cancella timeout precedente
//   if (raid.timeout) clearTimeout(raid.timeout);

//   raid.end = newEnd;

//   // Imposta nuovo timeout
//   addRaid(raid);
// }

async function closeRaid(bot, ctx, raid) {
  const raidId = raid.getId();
  const messageId = raid.getIdMessagge();

  console.log(`Chiusura raid ${raidId}...`);

  if (messageId) {
    try {
      // Modifica il messaggio per indicare che il raid è chiuso
      const closedMessage = await formatRaid(raid) + "\n\n🔒 *Raid chiuso*";
      await bot.api.editMessageText(
        ctx.chat.id,
        messageId,
        closedMessage,
        {
          parse_mode: "Markdown",
          disable_web_page_preview: true,
          reply_markup: new InlineKeyboard() // Rimuovi la tastiera
        }
      );
    } catch (err) {
      console.error(`Errore durante la chiusura del raid ${raidId}:`, err);
    }
  }

  // Rimuovi dalle Map
  raids.delete(raidId);
  // raidMessageMap.delete(raidId);
  
  console.log(`Raid ${raidId} eliminato dalla memoria`);
}
