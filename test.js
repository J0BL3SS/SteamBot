require('dotenv').config();
const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
 
const client = new SteamUser();
const community = new SteamCommunity();

const logOnOptions = {
	accountName: process.env.STEAM_ACCOUNT_NAME,
	password: process.env.STEAM_ACCOUNT_PASS,
	twoFactorCode: SteamTotp.generateAuthCode(process.env.STEAM_SHARED_SECRET)
};
 
client.logOn(logOnOptions);
 
client.on('loggedOn', () => {
	console.log('succesfully logged on.');
    client.setPersona(SteamUser.EPersonaState.Online);
	client.gamesPlayed(440);
});

const manager = new TradeOfferManager ({
	steam: client,
	community: community,
	language: 'en'
});
 
client.on("friendMessage", function(steamID, message) {
	if (message == "hi") {
		client.chatMessage(steamID, "hello, this works.");
	}
});
 
client.on('webSession', (sessionid, cookies) => {
	manager.setCookies(cookies);
 
	community.setCookies(cookies);
	community.startConfirmationChecker(2000, process.env.STEAM_IDENTITY_SECRET);
});
 
function acceptOffer(offer) {
	offer.accept((err) => {
		community.checkConfirmations();
		console.log("We Accepted an offer");
		if (err) console.log("There was an error accepting the offer.");
	});
}
 
function declineOffer(offer) {
	offer.decline((err) => {
		console.log("We Declined an offer");
		if (err) console.log("There was an error declining the offer.");
	});
}

 
client.setOption("promptSteamGuardCode", false);
 
manager.on('newOffer', (offer) => {
    console.log(`New offer #${offer.id} recieved from ${offer.partner.getSteamID64()}`);
    processOffer(offer);
});

function processOffer(offer) {
    client.gamesPlayed([]);
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