module.exports = {
    trigger: "help",
    execute(client, steamID, args) {
        client.chatMessage(steamID, "/pre Commands\n\n!buy <item name>: processes the purchase\n");
    },
};