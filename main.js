const welcomeScraper = require("./pageScrapers/welcomePageScraper.js");
const userPageScraper = require("./pageScrapers/userPageScraper.js");
const offerPageScraper = require("./pageScrapers/offerPageScraper.js");
const FileSystem = require("fs");

async function main() {
  console.log("-------Début du scraping-------");
  let updatedUsers = [];

  try {
    //appeller le welcome scraper

    let users = await welcomeScraper();

    //appeller le user scraper

    let j = 0;
    for (let user of users) {
      let updatedUser = await userPageScraper(user.profilLink);
      //Appel le scrapper d'offres
      let updatedOffers = [];
      for (let offer of updatedUser.offers) {
        let updatedOffer = await offerPageScraper(offer.link);
        updatedOffers.push(updatedOffer);
      }
      updatedUser.offers = updatedOffers;
      updatedUsers.push(updatedUser);
      let timeSeed = Math.trunc(Math.random() * 3000);
      setTimeout(() => {
        console.log("Waiting for loading the next user page");
        console.log("-> Break time:", timeSeed, "ms");
      }, timeSeed);
      j = j + 1;
    }

    //appeller le offer scraper
  } catch (error) {
    console.log(error.message);
  }
  let usersStringified = JSON.stringify(updatedUsers, null, 2);
  FileSystem.writeFile("updatedUsers.json", usersStringified, (error) => {
    console.log("error while writing");
  });
  console.log("-------Fin du scraping-------");
}

main();
