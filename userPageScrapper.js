const puppeteer = require("puppeteer");
const User = require("./User.js");
const Offer = require("./Offer.js");

const ADDRESS = "https://www.vinted.fr/member/59019518-lol02";

async function userPageScrapper() {
  console.log("création du browser");
  let browser = await puppeteer.launch({ headless: false });
  try {
    let page = await browser.newPage();
    console.log("nouvelle page créée");

    await page.setViewport({ width: 1200, height: 800 });
    console.log("view port set");

    let queryForUserProducts = "?tab=closet";

    await page.goto(ADDRESS + queryForUserProducts, {
      waitUntil: "networkidle2",
    });
    await page.waitForTimeout(4000);

    console.log("chargement terminé");
    //Récupération du profil de l'utilisateur
    //Récupération de l'entête utilisateur = div.profile.u-flex-direction-column
    let user = new User(ADDRESS);
    //Récupération de l'image de profil de l'utilisateur
    let userAvatarLinkMarkUp =
      "div.profile div.u-flexbox img.Image_content__lvAec";
    let userHasAvatarLink = await page.$eval(userAvatarLinkMarkUp, (el) =>
      el.hasAttribute("src")
    );
    let userAvatarLink = await await page.$eval(userAvatarLinkMarkUp, (el) =>
      el.getAttribute("src")
    );
    userHasAvatarLink && user.setAvatarLink(userAvatarLink);
    console.log(user);
    // console.log("end avatar");
    // Récupération de la notation moyenne
    let gradeFullMarkUp = "div.Rating_star__4M91J.Rating_full__kburJ";
    let gradeFull = await page.$$(gradeFullMarkUp);
    let gradeHalfMarkUp = "div.Rating_star__4M91J.Rating_half-full__3he7b";
    let gradeHalf = await page.$$(gradeHalfMarkUp);
    let totalGrade = gradeFull.length + gradeHalf.length * 0.5;
    user.setGrade(totalGrade);
    console.log(user);

    console.log("end average grade");
    // Récupération du nombre d'évaluations
    let ratingsStringMarkUp = "div.Rating_label__Do7Nn span.Text_text__QBn4-";
    let ratingsString = await page.$eval(
      ratingsStringMarkUp,
      (el) => el.innerHTML
    );
    let ratings = Number(
      ratingsString.split(" ").length === 2 ? ratingsString.split(" ")[0] : 0 //TODO vérifier si peut être parsé en nombre
    );
    user.setRatings(ratings);
    console.log(user);

    console.log("end number of ratings");
    //Récupération de la section "A propos" ===> NE FONCTIONNE PAS à REVOIR ==> si une data n'est pas trouvée alors skiper le user
    // let descriptionSectionXPath = "//span[contains(text(),'À propos :')]/..";
    // let descriptionSection = await page.waitForXPath(descriptionSectionXPath);
    // let aboutSectionMarkUp = "div.Cell_cell__3V4ao.Cell_tight__ArRHW";
    // let aboutSection = await descriptionSection.$$(aboutSectionMarkUp);
    // let aboutInformations = [];
    ////span[contains(text(),'À propos :')]/..//div[@class="Cell_body__10a_u"]
    let locationXPath =
      "//span[contains(text(),'À propos :')]/..//div[@class='Cell_body__10a_u']";
    let locationPossibleElements = await page.$x(locationXPath);

    if (locationPossibleElements.length >= 3) {
      let location = await locationPossibleElements[0].evaluate(
        (el) => el.innerText
      );
      console.log(location);
    }
    console.log("end of location");

    //Récupération du nombre de followers
    let followersXPath = "//div[contains(text(),'Abonné')]/a";
    let followersElement = await page.$x(followersXPath);

    if (followersElement.length === 1) {
      let followers = await followersElement[0].evaluate((el) => el.innerText);
      console.log(Number(followers));
    }
    console.log("end of followers");

    //Récupération du nombre d'abonnements
    let subscriptionsXPath = "//div[contains(text(),'Abonnement')]/a";
    let subscriptionsElement = await page.$x(subscriptionsXPath);
    if (subscriptionsElement.length === 1) {
      let subscriptions = await subscriptionsElement[0].evaluate(
        (el) => el.innerText
      );
      console.log(Number(subscriptions));
    }
    console.log("end of subscriptions");

    //Récupération de la date de dernière connexion
    let lastConnectionXPath =
      "//span[contains(text(),'Connect')]/..//span[@title]";
    let lastConnectionElement = await page.$x(lastConnectionXPath);
    if (lastConnectionElement.length > 0) {
      let dateLastConnection = await lastConnectionElement[0].evaluate(
        (el) => el.innerText
      );
      let dateString = await lastConnectionElement[0].evaluate((el) =>
        el.getAttribute("title")
      );
      let date = dateString.split(", ").join("T");
      console.log(date);

      console.log(dateLastConnection); // à traiter
    }
    console.log("end of connexion date");

    //getting vérifications :
    let verificationsXPath =
      "//span[contains(text(),'Information')]/..//div[@class='Cell_body__10a_u']";
    let verficationElements = await page.$x(verificationsXPath);

    for (let verification of verficationElements) {
      let verif = await verification.evaluate((el) => el.innerText);
      console.log(verif);
    }
    console.log("end vérifications");

    //récupérer la description du profil
    let descriptionSectionXPath = "//div[@class='profile__user-description']";
    let descriptionSection = await page.$x(descriptionSectionXPath);
    if (descriptionSection.length === 1) {
      //récupération de la description courte d'abord
      let shortDescriptionXPath = "./span[1]";
      let shortDescriptionElement = await descriptionSection[0].$x(
        shortDescriptionXPath
      );
      let shortDescription = null;
      if (shortDescriptionElement.length === 1) {
        shortDescription = await shortDescriptionElement[0].evaluate(
          (el) => el.innerText
        );
        console.log("Description courte 1:", shortDescription);
      }
      //alors vérifier si le button existe
      let moreDescriptionButtonXPath = "./span[@data-testid='more-button']";
      let moreDescriptionButton = await descriptionSection[0].$x(
        moreDescriptionButtonXPath
      );
      if (moreDescriptionButton.length === 1) {
        //alors on clique dessus
        await moreDescriptionButton[0].click();
        await page.waitForTimeout(1000);

        //on récupére la description complète du profil de l'utilisateur
        let newDescriptionSectionXPath =
          "//div[@class='profile__user-description']/span";
        let newDescriptionSection = await page.$x(newDescriptionSectionXPath);
        if (newDescriptionSection.length === 1) {
          //on s'attend à un élément
          let fullDescription = await newDescriptionSection[0].evaluate(
            (el) => el.innerText
          );
          console.log("description complète:", fullDescription);
        } else {
          //si plusieurs élément ou aucun élément trouvé, alors on vérifie s'il existe la description courte
          console.log("Description courte 2:", shortDescription);
        }
      }
    }
    console.log("end of parsing descriptions");

    // // user.setAboutInformations(aboutInformations);
    // // console.log(descriptionSection);
    // // console.log(aboutSection);
    // console.log("end of about section");

    // Récupération des liens des offres possibles
    let offersLinkXPath = "//a[@class='ItemBox_overlay__1kNfX']";
    let offersLink = await page.$x(offersLinkXPath);
    let offersLinks = [];
    for (let offerLink of offersLink) {
      let offerHasLink = offerLink.evaluate((el) => el.hasAttribute("href"));
      if (offerHasLink) {
        await offersLinks.push(
          await offerLink.evaluate((el) => el.getAttribute("href"))
        );
        console.log(offersLinks);
      }
    }
    console.log("end of offers links");

    // let commentsButtonXPath = "//span[contains(text(),'Évaluation')]/../..";
    // let commentsButtonElement = await page.$x(commentsButtonXPath);
    // if (commentsButtonElement.length === 1) {
    //   await commentsButtonElement.click();
    //   await page.waitForTimeout(1000);
    //   let commentXPath =
    //     "//div[@class='profile u-flex-direction-column']/./div[@class='Cell_cell__3V4ao']/.//div[@class='Cell_cell__3V4ao Cell_tight__ArRHW']";
    //   let commentsElements = await page.$x(commentXPath);
    //   // récupération de l'image de l'utilisateur : /div[@class='Cell_image__3kOWg']/.//img
    //   // récupération du contenu ./div[@class='Cell_content__2bRVC']
    //   //récupération du nom de lutilisateur et son lien : ./div[@class='Cell_title__1gULu']/a
    //   // récupération des dates : ./div[@class='Cell_subtitle__uOax3']/.//span[@title]

    // }

    // ajouter des commentaires aléatoires :
    // récupérant l'id des utilisateurs

    //Récupération des commentaires
    let queryForComments = "?tab=feedback";
  } catch (error) {
    console.log("Une erreur est survenue");
    console.log(error.message);
  }
  await browser.close();

  return null;
}

userPageScrapper();
module.exports = userPageScrapper;

//   let iconMarkUp = "div.Icon_icon__1jqT_";
//   let iconHasName = await infoPiece.$eval(iconMarkUp, (el) =>
//     el.hasAttribute("data-icon-name")
//   );
//   let iconName = null;
//   let info = null;

//   if (iconHasName) {
//     iconName = await infoPiece.$eval(iconMarkUp, (el) =>
//       el.getAttribute("data-icon-name")
//     );
//     let infoMarkUp = "div.Cell_body__10a_u";
//     info = await infoPiece.$eval(infoMarkUp, (el) => el.innerHTML);
//     console.log(info, info.indexOf("<"));
//     if (info.indexOf("<") >= 0) {
//       let subscriptionsMarkUp = "div.u-flexbox a";
//       let subscriptions = await infoPiece.$$eval(
//         subscriptionsMarkUp,
//         (el) => el.innerHTML
//       );
//       if (subscriptions.length == 2) {
//         aboutInformations.push({
//           infoType: "followers",
//           value: subscriptions[0],
//         });

//         aboutInformations.push({
//           infoType: "followings",
//           value: subscriptions[1],
//         });
//       }
//     } else {
//       aboutInformations.push({
//         infoType: iconName,
//         value: info,
//       });
//     }
