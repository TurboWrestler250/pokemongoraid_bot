// import { raids } from './raid.js';

export function raidsCommand(bot) {
    bot.command("raids", async (ctx) => {
        if (raids.size === 0) {
            return ctx.reply("❌ Non ci sono raid attivi al momento.");
        }
    
        const raidList = Array.from(raids.values())
            .map(r => `🆔 ${r.id} - ${r.pokemon} @ ${r.palestra}`)
            .join("\n");
    
        await ctx.reply(`📋 Raid attivi:\n\n${raidList}`);
    });
}