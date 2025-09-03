import { dataPokemon } from '../utils/dataPokemon.js';

export function infoCommand(bot) {
    bot.command("info", async (ctx) => {
        const args = ctx.match?.split(" ") || [];

        if (args.length !== 1) return ctx.reply("Uso: /raid [pokemon]");

        try {
            const pokemon = await dataPokemon(args[0]);
            await ctx.reply(`ℹ️ ID Pokédex di ${args[0]}: ${pokemon.id}`);
        } catch (err) {
            console.error("Error in infoCommand:", err);
            await ctx.reply("❌ Pokémon non trovato.");
        }
    });
}