module.exports = {
    trigger: "hi",
    execute(client, steamID, args) {
        client.chatMessage(steamID, "Hello!");
    },
};