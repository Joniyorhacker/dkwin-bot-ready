require('dotenv').config();
const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = process.env.ADMIN_IDS.split(',');
const REFERRAL_LINK = process.env.REFERRAL_LINK;

const bot = new Telegraf(BOT_TOKEN);

let pendingUsers = {};
let approvedUsers = {};

bot.start((ctx) => {
    const userId = ctx.from.id;
    if (approvedUsers[userId]) ctx.reply(`👋 Welcome back!`);
    else if (pendingUsers[userId]) ctx.reply(`⏳ Your UID is pending admin approval.`);
    else {
        ctx.reply(`Welcome!\nRegister first: ${REFERRAL_LINK}\nThen send your UID.`);
        pendingUsers[userId] = null;
    }
});

bot.on('text', (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text;

    if (!approvedUsers[userId]) {
        if (!pendingUsers[userId]) ctx.reply(`Please register first:\n${REFERRAL_LINK}`);
        else if (pendingUsers[userId] === null) {
            pendingUsers[userId] = text;
            ADMIN_IDS.forEach(admin => {
                bot.telegram.sendMessage(admin, `🔔 UID request:\nUser: @${ctx.from.username || ctx.from.first_name}\nID: ${userId}\nUID: ${text}`);
            });
            ctx.reply(`✅ Your UID has been sent to the admin.`);
        } else ctx.reply(`⏳ UID already pending approval.`);
        return;
    }

    if (text === "/help") ctx.reply("Commands: /help, /info");
    else if (text === "/info") ctx.reply(`Name: ${ctx.from.first_name}\nUsername: @${ctx.from.username || "N/A"}\nID: ${ctx.from.id}`);
    else ctx.reply("Unknown command.");
});

bot.command('approve', (ctx) => {
    const adminId = ctx.from.id;
    if (!ADMIN_IDS.includes(String(adminId))) return;

    const args = ctx.message.text.split(' ');
    if (args.length < 2) return ctx.reply("Usage: /approve <userId>");

    const userIdToApprove = args[1];
    if (pendingUsers[userIdToApprove]) {
        approvedUsers[userIdToApprove] = pendingUsers[userIdToApprove];
        delete pendingUsers[userIdToApprove];
        ctx.reply(`✅ User ${userIdToApprove} approved.`);
        bot.telegram.sendMessage(userIdToApprove, `🎉 Your UID approved!`);
    } else ctx.reply(`❌ No pending UID found.`);
});

bot.launch().then(() => console.log("DK WIN Bot started!"));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
