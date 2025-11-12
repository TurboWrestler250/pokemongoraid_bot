import { InlineKeyboard } from "grammy";
import Raid from "../models/raid.js";
import { dataPokemon } from '../utils/dataPokemon.js';
import { formatRaid } from "../utils/formatRaid.js";
import { findGymByKeywords } from "../utils/gyms.js";
import { raidKeyboard } from "../utils/keyboards.js";

export const raids = new Map();           // Struttura dei raid memorizzati in memoria
export const raidMessageMap = new Map();	// Dizionario per associare raid ID -> Telegram message ID
const raidCallbacks = new Map();

export function setupRaidListener(bot) {
  bot.on("callback_query:data", async (ctx) => {
    const [pokemonName, raidId] = ctx.callbackQuery.data.split(":");
    if (raidCallbacks.has(raidId)) {
      const resolve = raidCallbacks.get(raidId);
      resolve(pokemonName);           // risolve la Promise
      raidCallbacks.delete(raidId);  // rimuove la callback
      await ctx.answerCallbackQuery(); 
    }
  });
}

// import { fetchBosses } from '../ScrapedDuck/ScrapedDuck-mio.js';

// step 0 : verificare se ha tutti i parametri richiesti
// step 1 : ricevere nome del pokemon
// verificare se nella lista compaiono più forme del pokemon
// negativo, assegnare il nome della lista
// affermativo, chiedere di sceglierne uno
// utilizzare il nome scelto dall'utene nel raid

// listner/handler del bot per ascoltare il comando
// se sono presenti più nomi, Promise per creare la scelta
// creare il raid

export function raidCommand(bot) {
  bot.command("raid", async (ctx) => {
    // fetchBosses();

    const args = ctx.match?.split(" ") || [];

    if (args.length < 3) {
      //                            0         1           2           3           4
      return ctx.reply("Uso: /raid [pokemon] [gym] [ora inizio] [ora fine?] [note?]");
    }

    const id = Math.floor(Math.random()*1000000);
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

    let pokemon_api;
    const data_pokemon = await dataPokemon(pokemon.toLowerCase());
    if (data_pokemon.length < 1) console.log("qui c'è un problema");
    if (data_pokemon.length === 1) pokemon_api = pokemon;
    if (data_pokemon.length > 1) {
      const inlineKeyboard = new InlineKeyboard();
      for (const pokemon of data_pokemon) {
        inlineKeyboard.text(pokemon.name, pokemon.name+":"+id).row()
      }
      await ctx.reply("Che pokemon scegli?", { 
        reply_markup: inlineKeyboard,
        parse_mode: "Markdown",
        link_preview_options: {
          is_disabled: true,
        }
      });
      console.log(new Date().toLocaleString(), "Sto per fare la Promise per il nome dentro il comando /raid");
      pokemon_api = await new Promise((resolve) => {
        console.log(new Date().toLocaleString(), "sono dentro la Promise della scelta del nome");
        raidCallbacks.set(id.toString(), resolve);
        console.log(new Date().toLocaleString(), "dopo la Promise della scelta del nome")
      });
    };

    const raid = new Raid({
      id:       id,
      pokemon:  pokemon_api,
      gym:      gym.nome,
      lat:      gym.lat,
      lon:      gym.lon,
      start:    start,
      end:      end,
      notes:    notes,
      creator:  ctx.from?.first_name
    });

    // addRaid(bot, ctx, raid);
    raids.set(raid.getId(), raid);

    console.log(`Raid creato: ${raid.getPokemon()} - ID: ${raid.getId()}`);
    scheduleRaidClose(bot, ctx, raid, timePattern);

    const sendMessage = await ctx.reply(await formatRaid(raid), { 
      reply_markup: raidKeyboard(raid.getId()),
      parse_mode: "Markdown",
      link_preview_options: {
          is_disabled: true,
        }
    });
    
    raidMessageMap.set(raid.getId(), sendMessage.message_id);
    console.log(`Associato Raid ${raid.getId()} al messaggio ${sendMessage.message_id}`);
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
    delay = 12 * 60 * 60 * 1000; // 12 ore in ms
  }

  // Imposta timeout per distruggere il raid
  setTimeout(async () => {
  try {
    await closeRaid(bot, ctx, raid);
  } catch (err) {
    console.error("Errore nella chiusura del raid:", err);
  }
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
  const messageId = raidMessageMap.get(raidId);

  console.log(`Chiusura raid ${raidId}...`);

  if (messageId) {
    try {
      // Modifica il messaggio per indicare che il raid è chiuso
      const closedMessage = await formatRaid(raid) + "\n\n🔒 *Raid chiuso*";
      await ctx.editMessageText(ctx.chat.id, messageId, closedMessage, {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: [] },
        link_preview_options: {
          is_disabled: true,
        }
      });
      
      // Rimuovi la tastiera
      await bot.api.editMessageReplyMarkup(ctx.chat.id, messageId, {
        reply_markup: { inline_keyboard: [] }
      });
    } catch (err) {
      console.error(`Errore durante la chiusura del raid ${raidId}:`, err);
    }
  }

  // Rimuovi dalle Map
  raids.delete(raidId);
  raidMessageMap.delete(raidId);
  
  console.log(`Raid ${raidId} eliminato dalla memoria`);
}
