const welcomeScraper = require("./pageScrapers/welcomePageScraper.js");
const userPageScraper = require("./pageScrapers/userPageScraper.js");
const offerPageScraper = require("./pageScrapers/offerPageScraper.js");
const FileSystem = require("fs");
const Review = require("./objects/Review.js");
const generateComments = require("./globals/helpers.js");
//TODOS:
//donload images
//persisting images in jsons
//pergenerate comments (max comments, customized comments) => doner

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
      //Save users
      updatedUser.offers = updatedOffers;
      updatedUsers.push(updatedUser);
      //waiting time between two calls
      let timeSeed = Math.trunc(Math.random() * 3000);
      setTimeout(() => {
        console.log("Waiting for loading the next user page");
        console.log("-> Break time:", timeSeed, "ms");
      }, timeSeed);
      j = j + 1;
    }
    bindCommentsToUsers(updatedUsers);
  } catch (error) {
    console.log(error.message);
  }
  let usersStringified = JSON.stringify(updatedUsers, null, 2);
  FileSystem.writeFile(
    "./exports/updatedUsers.json",
    usersStringified,
    (error) => {
      console.log("error while writing");
    }
  );
  console.log("-------Fin du scraping-------");
}

function bindCommentsToUsers(users) {
  console.log("binding comments to users");
  let i = 0;
  for (let user of users) {
    console.log("Binding user:", i);
    let j = 0;
    for (let offer of user.offers) {
      let blackList = [];
      console.log("Binding offer:", j);
      let comments = generateComments();
      let k = 0;
      for (let comment of comments) {
        console.log("Binding comment:", k, "out of :", comments.length);
        let userHasCommentedOffer = true;
        while (userHasCommentedOffer) {
          let pickedUserId = Math.trunc(Math.random() * users.length);
          if (users.length === blackList.length) {
            userHasCommentedOffer = false;
          } else {
            userHasCommentedOffer = blackList.includes(pickedUserId);
          }
          console.log(pickedUserId);
          if (!userHasCommentedOffer) {
            blackList.push(pickedUserId);
            console.log(blackList);
            offer.comments.push(
              new Review(
                users[pickedUserId].nickName,
                users[pickedUserId].profilLink,
                comment.comment,
                comment.scoring
              )
            );
            console.log(offer);
          }
        }
        k = k + 1;
      }
      j = j + 1;
    }
    i = i + 1;
  }
}

main();
