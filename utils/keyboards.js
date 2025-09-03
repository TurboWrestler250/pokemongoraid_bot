// utils/keyboards.js
import { InlineKeyboard } from "grammy";

export function raidKeyboard(raidId) {
	return new InlineKeyboard()
		.text("🚶", `join:${raidId}:🚶`)
		.text("✈️", `join:${raidId}:✈️`)
		.text("📡", `join:${raidId}:📡`)
		.text("✉️", `join:${raidId}:✉️`)
		.text("❌", `leave:${raidId}:❌`)
		.row()
		// .text("⚙️", `join:${raidId}:⚙️`)
		.text("🔄", `refresh:${raidId}:🔄`);
}
