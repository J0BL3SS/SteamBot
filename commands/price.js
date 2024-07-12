require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const { parseString, stringify, parseSKU, toSKU } = require('tf2-item-format/static');

module.exports = {
    trigger: "price",
    async execute(client, steamID, args) {
        try {
            if(args.length < 1) {
                client.chatMessage(steamID, "⚠️ Command usage: !price <item name>");
            } else {

                const itemName = stringify(parseSKU(toSKU(parseString(args.join(' '), true, true))), { determineUniqueHat: true });

                // Make an asynchronous API call using Axios
                const response = await axios.get(`https://backpack.tf/api/classifieds/listings/snapshot?sku=${itemName}&appid=440&token=${process.env.BPTF_ACCESS_TOKEN}`);
                
                // Extract the data from the response
                const data = response.data;
                
                const object = processClassifiedObjects(data.listings);
                
                client.chatMessage(steamID, `/pre 💰 Price for '${itemName}'\nItem sku: ${toSKU(parseString(itemName, true, true))}\n\nSell Orders:\n${object.sell}\n\nBuy Orders:\n${object.buy}`);
            }
        } catch (error) {
            console.error('Price Error: ', error);
        }
    },
};


function processClassifiedObjects(classifiedObjects) {
    const listings = { sell: [], buy: [] };
    const maxItemsPerIntent = 11; // Maximum items per intent
  
    let sellCount = 0;
    let buyCount = 0;
  
    for (const classifiedObject of classifiedObjects) {
      if (classifiedObject.userAgent) {
        const currencyInfo = {
          keys: classifiedObject.currencies.keys || 0,
          metal: classifiedObject.currencies.metal || 0,
        };
  
        // Check if both key and metal are non-zero before adding to listings
        if (currencyInfo.keys !== 0 || currencyInfo.metal !== 0) {
          if (classifiedObject.intent === 'sell') {
            if (sellCount < maxItemsPerIntent) {
              listings.sell.push(currencyInfo);
              sellCount++;
            }
          } else if (classifiedObject.intent === 'buy') {
            if (buyCount < maxItemsPerIntent) {
              listings.buy.push(currencyInfo);
              buyCount++;
            }
          }
  
          // Check if we've reached the maximum items for both intents
          if (sellCount >= maxItemsPerIntent && buyCount >= maxItemsPerIntent) {
            break; // Exit the loop if both intents have reached their limits
          }
        }
      }
    }
  
    console.log(listings);
    return listings;
}