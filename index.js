require('dotenv').config();

const fs = require('fs');
const path = require('path');

const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
const { parseString, stringify, parseSKU, toSKU } = require('tf2-item-format/static');

const client = new SteamUser();
const community = new SteamCommunity();

client.setOption("promptSteamGuardCode", false);

const manager = new TradeOfferManager({
    steam: client,
    community: community,
    language: "en",
    pollInterval: 5000
});

const logOnOptions = {
    accountName: process.env.STEAM_ACCOUNT_NAME,
    password: process.env.STEAM_ACCOUNT_PASS,
    twoFactorCode: SteamTotp.generateAuthCode(process.env.STEAM_SHARED_SECRET),
    logonID: Math.floor(Math.random() * 4294967294)
};

client.logOn(logOnOptions);

client.on("error", function(err) {
	console.log(`There is an error occured while logging in: ${err}`);
});

client.on("loggedOn", () => {
    console.log(`Logged into Steam as ${client.steamID.getSteamID64()}`);
    client.setPersona(SteamUser.EPersonaState.Online);
    client.gamesPlayed(440);
});

client.on('webSession', function(sessionID, cookies) {
	manager.setCookies(cookies, function(err) {
		if (err) {
			console.log("Manager cookie error: " + err);
			process.exit(1); // Fatal error since we couldn't get our API key
		}
        console.log("Got Session ID: " + sessionID);
		console.log("Got API key: " + manager.apiKey);
	});

	community.setCookies(cookies);
    
    /*
    community.getUserInventoryContents(process.env.OWNER_STEAM_ID, 440, 2, true, (err, inventory) => {
        if(err) {
            console.log('An Error Occured While getting inventory contents');
        } else {
            const itemDataArray = [];

            for (const item of inventory) {
                const itemData = {
                    name: item.name,
                    sku: toSKU(parseString(item.name, true, true)),
                    assestid: item.assetid
                }
                itemDataArray.push(itemData);
            }

            console.log("Found " + inventory.length + " TF2 items");
            console.log(itemDataArray);

            let offer = manager.createOffer(steamID);
            offer.addMyItems(inventory);
            offer.setMessage("TEST: Here, have some items!");
            offer.send(function(err, status) {
				if (err) {
					console.log(err);
					return;
				}

                if (status === 'pending') {
                    confirmOffer(offer);
                }
            });
        }
    });
    */
    
});

// Messages
client.on('friendMessage', function(steamID, message) {

    const args = message.slice(1).split(' '); 
    const input = args.shift().toLowerCase();

    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    let commandFound = false;
    for (const file of commandFiles) {
        const command = require(path.join(__dirname, 'commands', file));
        if (command.trigger === input) {
            commandFound = true;
            command.execute(client, steamID, community, args);
            break;
        }
    }

    /*
    if (!commandFound) {
        client.chatMessage(steamID, `❌ I couldn't find any command named "${input}". Try typing "!help".`);
    }
    */
});

let processingUsers = {};

//Trade Offers

manager.on("newOffer", (offer) => {
    console.log(`New offer #${offer.id} recieved from ${offer.partner.getSteamID64()} at ${new Date()}`);
    processOffer(offer);
});

client.on('newItems', function(count) {
	console.log(count + " new items in our inventory");
});

manager.on('pollData', function(pollData) {

});

manager.on('receivedOfferChanged', function(offer, oldState) {
	console.log(`Offer #${offer.id} changed: ${TradeOfferManager.ETradeOfferState[oldState]} --> ${TradeOfferManager.ETradeOfferState[offer.state]}`);

	if (offer.state == TradeOfferManager.ETradeOfferState.Accepted) {
		offer.getExchangeDetails((err, status, tradeInitTime, receivedItems, sentItems) => {
			if (err) {
				console.log(`There was an error: ${err}`);
				return;
			}
            
            //console.log(receivedItems);
            console.log('Time: ' + tradeInitTime);

			// Create arrays of just the new assetids using Array.prototype.map and arrow functions
			let newReceivedItems = receivedItems.map(item => item.new_assetid);
			let newSentItems = sentItems.map(item => item.new_assetid);

			console.log(`Received items ${newReceivedItems.join(', ')} Sent Items ${newSentItems.join(', ')} - Status: ${TradeOfferManager.ETradeStatus[status]}`);
            client.chatMessage(offer.partner.getSteamID64(), "I am accepted your trade offer!");
		})
	}
});

function processOffer(offer) {
    if(offer.isGlitched() || offer.state === 11) {
        declineOffer(offer);
    } else if(offer.partner.getSteamID64() === process.env.OWNER_STEAM_ID) {
        console.log(`Accepting trade offer #${offer.id}`);
        acceptOffer(offer);
    } else {
        console.log(`Declining trade offer #${offer.id}`);
        declineOffer(offer);
    }
}

function declineOffer(offer) {
    offer.decline((err) => {
        if(err) console.log(`Failed to decline trade offer #${offer.id} : ${err}`);
        console.log(`Trade offer #${offer.id} declined succesfully`);
    }); 
}

function acceptOffer(offer, retries = 3) {
    offer.accept((err, status) => {
        if (err) { 
            console.log(`Failed to accept trade offer #${offer.id} : ${err}`); 
            // You can implement a retry mechanism here if needed
            if (retries > 0) {
                console.log(`[${offer.id}] Retrying in 2 seconds... (${retries} retries left)`);
                setTimeout(() => acceptOffer(offer, retries - 1), 2000); // Retry after 5 seconds
            } else {
                console.log(`[${offer.id}] Max retries reached. Giving up.`);
            }
        } else {
            console.log(`Trade offer #${offer.id} accepted successfully`);
            if (status === 'pending') {
                confirmOffer(offer);
            }
        }
    });
}

function confirmOffer(offer, retries = 3) {
    community.acceptConfirmationForObject(process.env.STEAM_IDENTITY_SECRET, offer.id, (err) => { 
        if (err) { 
            console.log(`Failed to accept confirmation on #${offer.id} : ${err}`);
            if (retries > 0) {
                console.log(`[${offer.id}] Retrying in 2 seconds... (${retries} retries left)`);
                setTimeout(() => confirmOffer(offer, retries - 1), 2000); // Retry after 5 seconds
            } else {
                console.log(`[${offer.id}] Max retries reached. Giving up.`);
            }
        } else {
            console.log(`Object #${offer.id} confirmed successfully`);
        }
    });
}


module.exports = {
    processingUsers: processingUsers
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

function gracefulShutdown() {
    client.logOff();
    console.log('Received termination signal.');
}

client.on('disconnected', (eresult, msg) => {
    console.log(`Disconnected from Steam: ${eresult}# - ${msg}`);
    process.exit(1);
});