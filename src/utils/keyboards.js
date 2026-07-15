import { InlineKeyboard } from "grammy";

export function raidKeyboard(raidId) {
	return new InlineKeyboard()
		.text("🍺", `join:${raidId}:🍺`)
		.text("🚶", `join:${raidId}:🚶`)
		.text("✈️", `join:${raidId}:✈️`)
		.text("📡", `join:${raidId}:📡`)
		.text("✉️", `join:${raidId}:✉️`)
		.row()
		.text("❌", `leave:${raidId}:❌`)
		.text("🔄", `refresh:${raidId}:🔄`);
		// .text("⚙️", `join:${raidId}:⚙️`)
}
