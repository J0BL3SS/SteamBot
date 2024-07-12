const { processingUsers } = require('../index.js');

module.exports = {
    trigger: "buy",
    execute(client, steamID, args) {
        if(args.length < 1) {
            client.chatMessage(steamID, "⚠️ Command usage: !buy <item name>");
        } else {

            if(processingUsers[steamID]) {
                return client.chatMessage(steamID, `⚠️ You have an ongoing trading process!`);
            }

            const itemName = args.join(' ');

            if(itemName == "Mann Co. Supply Crate Key") {   
                processingUsers[steamID] = true;
                client.chatMessage(steamID, `/pre 🛒 Cart\n\nPurchase process for ${itemName}\n\n💎 Gems: 8022\n⚙️ Metal: 80.22\n\nYou can select either gems or metals as the payment method for trading.\nTo choose any method, type "!gems" or "!metal". You can type "!cancel" to cancel this process.`);
            } else {
                client.chatMessage(steamID, `I don't sell "${itemName}" yet.`);
            }
        }
    },
};