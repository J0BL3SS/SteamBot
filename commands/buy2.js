const { processingUsers } = require('../index.js');
const { parseString, stringify, parseSKU, toSKU } = require('tf2-item-format/static');

module.exports = {
    trigger: "buy2",
    async execute(client, steamID, community, args) {
        if(args.length < 1) {
            client.chatMessage(steamID, "⚠️ Command usage: !buy2 <item name>");
        } else {

            if(processingUsers[steamID]) {
                return client.chatMessage(steamID, `⚠️ You have an ongoing trading process!`);
            }

            const itemName = args.join(' ');
            let theirItems = [];
            let ourItems = [];

            await community.getUserInventoryContents(steamID, 440, 2, true, (err, inventory)=> {
                if(err) {
                    console.log('An Error Occurred While getting inventory contents: ' + err);
                    
                } else {
                    const itemDataArray = [];
                    for (const item of inventory) {
                        const itemData = {
                            name: item.name,
                            sku: toSKU(parseString(item.name, true, true)),
                            assetid: item.assetid
                        }
                        itemDataArray.push(itemData);
                    }
                    console.log('Their Items: '+ itemDataArray[1]);
                }
            });

            await community.getUserInventoryContents(client.steamID.getSteamID64(), 440, 2, true, (err, inventory)=> {
                if(err) {
                    console.log('An Error Occurred While getting inventory contents: ' + err);
                    
                } else {
                    const itemDataArray = [];
                    for (const item of inventory) {
                        const itemData = {
                            name: item.name,
                            sku: toSKU(parseString(item.name, true, true)),
                            assetid: item.assetid
                        }
                        itemDataArray.push(itemData);
                    }
                    console.log('Our Items: '+ itemDataArray[1]);
                }
            });

            
            

            /*
            if(itemName == "Mann Co. Supply Crate Key") {   
                processingUsers[steamID] = true;
                client.chatMessage(steamID, `/pre 🛒 Cart\n\nPurchase process for ${itemName}\n\n💎 Gems: 8022\n⚙️ Metal: 80.22\n\nYou can select either gems or metals as the payment method for trading.\nTo choose any method, type "!gems" or "!metal". You can type "!cancel" to cancel this process.`);
            } else {
                client.chatMessage(steamID, `I don't sell "${itemName}" yet.`);
            }
            */
        }
    },
};
