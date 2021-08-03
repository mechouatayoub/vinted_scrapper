const welcomeScraper = require("./pageScrapers/welcomePageScraper.js");
const userPageScraper = require("./pageScrapers/userPageScraper.js");
const offerPageScraper = require("./pageScrapers/offerPageScraper.js");
const FileSystem = require("fs");
const Review = require("./objects/Review.js");
const generateComments = require("./globals/helpers.js");
const uploadToCloudinary = require("./globals/cloudinaryUploader.js");
const dotEnv = require("dotenv").config();
const uploadToMongDB = require("./globals/mongoDBUploader.js");
//TODOS:
//donload images
//persisting images in jsons
//pergenerate comments (max comments, customized comments) => doner

async function main() {
  console.log("-------Début du scraping-------");
  let updatedUsers = [];

  try {
    ////////////////////////////SCRAPPING
    //appeller le welcome scraper

    let users = await welcomeScraper();

    //appeller le user scraper

    let j = 0;
    for (let user of users) {
      console.log("sSSSSSScrapping user:", j);
      let updatedUser = await userPageScraper(user.profilLink);
      //Appel le scrapper d'offres
      let updatedOffers = [];
      let i = 0;
      for (let offer of updatedUser.offers) {
        console.log("SSSSScrapping Offer:", i);
        let updatedOffer = await offerPageScraper(offer.link);
        updatedOffers.push(updatedOffer);
        i = i + 1;
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
    FileSystem.writeFile(
      "./exports/usersupToDate.json",
      JSON.stringify(users, null, 2),
      (error) => {
        console.log(
          "Une erreur est survenur lors de l'écriture du fichier userslinks.js"
        );
      }
    );
    bindCommentsToUsers(updatedUsers);

    ////////UPLOADING TO CLOUDINARY
    await uploadToCloudinary(updatedUsers);

    ///////UPLOADING TO MONGO DB
    await uploadToMongDB(updatedUsers);
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
    console.log("Binding user:", i, user.profilLink);
    let j = 0;
    for (let offer of user.offers) {
      let blackList = [];
      console.log("Binding offer:", j);
      let comments = generateComments();
      console.log("all comments:", comments);
      let k = 0;
      for (let comment of comments) {
        console.log(
          "Binding comment:",
          k,
          "out of :",
          comments.length,
          comment
        );
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
