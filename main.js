const welcomeScraper = require("./welcomePageScraper.js");
const userPageScraper = require("./userPageScraper.js");
// const users = require("./UsersLinks.json");
const FileSystem = require("fs");

async function main() {
  console.log("-------Début du scraping-------");
  let updatedUsers = [];

  try {
    //appeller le welcome scraper
    let users = welcomeScraper();

    //appeller le user scraper

    let j = 0;
    for (let user of users) {
      if (j === 1) {
        break;
      }
      let updatedUser = await userPageScraper(user.profilLink);
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
