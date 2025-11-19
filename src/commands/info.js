import { dataPokemon } from '../utils/dataPokemon.js';
import { createPicker } from '../utils/picker.js';
import { InlineKeyboard } from 'grammy';

export function infoCommand(bot) {
    bot.command("info", async (ctx) => {
        const args = ctx.match?.split(" ") || [];

        if (args.length !== 1) return ctx.reply("Uso: /raid [pokemon]");

        try {
            const res = await dataPokemon(args[0]);

            // Se più risultati, chiedi all'utente di scegliere
            if (Array.isArray(res)) {
                const token = `${Date.now()}_${ctx.from.id}_${Math.floor(Math.random()*10000)}`;
                const keyboard = new InlineKeyboard();
                res.slice(0, 10).forEach(p => keyboard.text(p.name, `pickpoke|${token}|${p.name}`).row());

                const msg = await ctx.reply('Ho trovato più risultati. Seleziona il Pokémon:', { reply_markup: keyboard });

                try {
                    const selection = await createPicker(token, ctx.from.id, 60000);
                    const detail = await dataPokemon(selection);
                    await ctx.reply(`ℹ️ ID Pokédex di ${selection}: ${detail.id}`);
                } catch (err) {
                    await ctx.reply('Selezione non effettuata o scaduta.');
                }
                return;
            }

            await ctx.reply(`ℹ️ ID Pokédex di ${args[0]}: ${res.id}`);
        } catch (err) {
            console.error("Error in infoCommand:", err);
            await ctx.reply("❌ Pokémon non trovato.");
        }
    });
}