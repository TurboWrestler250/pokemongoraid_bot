import { InlineKeyboard } from "grammy";
import { raids } from "../utils/raids.js";
import { findGymByKeywords } from "../utils/gyms.js";
import { formatRaid } from "../utils/formatRaid.js";

export default function raidCommand(bot) {
  bot.command("raid", async (ctx) => {
    const args = ctx.match?.split(" ") || [];

    if (args.length < 3) {
      return ctx.reply("Uso: /raid [pokemon] [palestra] [ora inizio] [ora fine?] [note?]");
    }

    const pokemon = args[0] || "";
    const timePattern = /^\d{1,2}:\d{2}$/;
    let startIndex = args.findIndex((a) => timePattern.test(a));
    if (startIndex === -1) return ctx.reply("Orario di inizio non trovato.");

    const palestraWords = args.slice(1, startIndex);
    const palestraInfo = findGymByKeywords(palestraWords);
    const palestra = palestraInfo.nome;
	const coordinates = palestraInfo.coords;
	const start = args[2] ? args[2] : "";
    const end = args[3]?.match(/^\d{1,2}:\d{2}$/) ? args[3] : "";
	const notes = args[4] ? args.slice(4).join(" ") : args.slice(3).join(" ");


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

    raids.set(raidId, raid);

    const keyboard = new InlineKeyboard()
      .text("🚶", `join:${raidId}:🚶`)
      .text("✈️", `join:${raidId}:✈️`)
      .text("📡", `join:${raidId}:📡`)
      .text("✉️", `join:${raidId}:✉️`)
      .text("❌", `leave:${raidId}:❌`)
      .row()
      .text("⚙️", `join:${raidId}:⚙️`)
      .text("🔄", `join:${raidId}:🔄`);

    await ctx.reply(formatRaid(raid), {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });
  });
}
