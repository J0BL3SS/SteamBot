const { processingUsers } = require('../index.js');

module.exports = {
    trigger: "pay",
    execute(client, steamID, args) {
        if(args.length != 1) {
            client.chatMessage(steamID, "⚠️ Command usage: !pay <method>\nMethods: gems, metal");
        } else {

            if(!processingUsers[steamID]) {
                return client.chatMessage(steamID, `⚠️ You don't have an ongoing trading process!`);
            }
            
            let successful = false;

            if(args == "metal") {
                successful = true;
                client.chatMessage(steamID, `⌛ Please wait while I process your offer with metals!`);
            } else if (args == "gems") {
                successful = true;
                client.chatMessage(steamID, `⌛ Please wait while I process your offer with gems!`);
            } else {
                client.chatMessage(steamID, "⚠️ Command usage: !pay <method>\nMethods: gems, metal");
            }

            if (processingUsers.hasOwnProperty(steamID) && successful) {
                delete processingUsers[steamID]; // Remove the steamID from the processingUsers object
            }
        }
    },
};