import { commands } from '../bot.js';

export async function listenerCommands(bot) {
    // Middleware globale: intercetta tutti i messaggi
    bot.on("message:text", async (ctx, next) => {
        const text = ctx.message.text;
        // Se il messaggio inizia con "/"
        if (text.startsWith("/")) {
            const command = text.split(" ")[0].substring(1); // es. "/raid" -> "raid"
            
            // Dopo 5 secondi elimina il messaggio
            if (commands.includes(command)) {
                setTimeout(() => {
                    ctx.deleteMessage().catch(err => {
                        console.error("Errore eliminando comando:", err.description || err);
                    });
                }, 5000);
            }
        }

        // Continua con il resto del bot (es. comandi registrati)
        await next();
    });
}