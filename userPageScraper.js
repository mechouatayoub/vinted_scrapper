const puppeteer = require("puppeteer");
const User = require("./User.js");
const Offer = require("./Offer.js");

// const ADDRESS = "https://www.vinted.fr/member/17295984-emma0626";

async function userPageScraper(address) {
  console.log("création du browser");
  let browser = await puppeteer.launch({ headless: false });
  let user = null;
  try {
    let page = await browser.newPage();
    console.log("nouvelle page créée");

    await page.setViewport({ width: 1200, height: 800 });
    console.log("view port set");

    await page.goto(address, {
      waitUntil: "networkidle2",
    });
    await page.waitForTimeout(4000);

    console.log("chargement terminé");
    user = await startScraping(page, address);
    console.log(user);
  } catch (error) {
    console.log("Une erreur est survenue");
    console.log(error.message);
  }
  await browser.close();

  return user;
}

async function getAvatarLink(page) {
  //Récupère l'avatar de l'utilisateur et modifie l'objet user
  console.log("--> début de récupération de l'avatar");
  let avatarLink = null;
  //Récupération de l'image de profil de l'utilisateur
  let userAvatarLinkMarkUp =
    "div.profile div.u-flexbox img.Image_content__lvAec";
  try {
    let userHasAvatarLink = await page.$eval(userAvatarLinkMarkUp, (el) =>
      el.hasAttribute("src")
    );
    if (userHasAvatarLink) {
      // l'utilisateur a un avatar
      let userAvatarLink = await page.$eval(userAvatarLinkMarkUp, (el) =>
        el.getAttribute("src")
      );
      avatarLink = userAvatarLink;
    }
  } catch (error) {
    console.log(
      "Impossible de récupérer l'avatar de l'utilisateur car ",
      error.message
    );
  }
  console.log("--> fin de récupération de l'avatar");

  return avatarLink;
}

async function getAverageScore(page) {
  //traduit le nombre détoiles sur le profil en note moyenne (4 étoiles et demie => note obtenue de 4.5)
  console.log("--> début de récupération de la note moyenne");

  let averageScore = null;
  let gradeFullMarkUp = "div.Rating_star__4M91J.Rating_full__kburJ"; // pour récupérer les étoiles complètes
  let gradeHalfMarkUp = "div.Rating_star__4M91J.Rating_half-full__3he7b"; //pour récupérer les moitiès d'étoiles
  try {
    let gradeFull = await page.$$(gradeFullMarkUp);
    let gradeHalf = await page.$$(gradeHalfMarkUp);
    averageScore = gradeFull.length + gradeHalf.length * 0.5;
  } catch (error) {
    console.log(
      "Impossible de récupérer la notation moyenne de l'utilisateur car ",
      error.message
    );
  }
  console.log("--> fin de récupération de la note moyenne");

  return averageScore;
}

async function getAssessmentsCount(page) {
  console.log("--> début de récupération du nombre d'évaluations");

  let assessmentsCount = null;
  let ratingsStringMarkUp = "div.Rating_label__Do7Nn span.Text_text__QBn4-";

  try {
    let ratingsString = await page.$eval(
      ratingsStringMarkUp,
      (el) => el.innerHTML
    );
    let ratings = Number(
      ratingsString.split(" ").length === 2 ? ratingsString.split(" ")[0] : 0 //TODO vérifier si peut être parsé en nombre
    );
    assessmentsCount = Number(ratings);
  } catch (error) {
    console.log(
      "Impossible de récupérer le nombre d'évaluations de l'utilisateur de l'utilisateur car ",
      error.message
    );
  }
  console.log("--> fin de récupération du nombre d'évaluations");
  return assessmentsCount;
}

async function getUserLocation(page) {
  console.log("--> début de récupération de la localisation de l'utilisateur");
  let location = { city: null, country: null };
  let locationXPath =
    "//span[contains(text(),'À propos :')]/..//div[@class='Cell_body__10a_u']";
  try {
    let locationPossibleElements = await page.$x(locationXPath);

    if (locationPossibleElements.length >= 3) {
      let locationString = await locationPossibleElements[0].evaluate(
        (el) => el.innerText
      );
      let locationSplit = locationString.split(", ");
      if (locationSplit.length === 2) {
        location.country = locationString.split(", ")[1];
        location.city = locationString.split(", ")[0];
      }
      if (locationSplit.length === 1) {
        location.city = null;
        location.country = locationString;
      }
    }
    console.log("end of location");
  } catch (error) {
    console.log(
      "Impossible de récupérer la localisation de l'utilisateur car ",
      error.message
    );
  }
  console.log("--> fin de récupération de la localisation de l'utilisateur");
  return location;
}

async function getFollowersCount(page) {
  console.log("--> début de récupération du nombre de followers");
  let followersCount = null;
  let followersXPath = "//div[contains(text(),'Abonné')]/a";

  try {
    let followersElement = await page.$x(followersXPath);

    if (followersElement.length === 1) {
      let followers = await followersElement[0].evaluate((el) => el.innerText);
      followersCount = Number(followers);
    }
  } catch (error) {
    console.log(
      "Impossible de récupérer le nombre de followers de l'utilisateur car ",
      error.message
    );
  }
  console.log("--> fin de récupération du nombre de followers");
  return followersCount;
}

async function getFollowingsCount(page) {
  console.log("--> début de récupération du nombre de followings");
  let followingsCount = null;
  let subscriptionsXPath = "//div[contains(text(),'Abonnement')]/a";

  try {
    let subscriptionsElement = await page.$x(subscriptionsXPath);
    if (subscriptionsElement.length === 1) {
      let subscriptions = await subscriptionsElement[0].evaluate(
        (el) => el.innerText
      );
      followingsCount = Number(subscriptions);
    }
    console.log("end of subscriptions");
  } catch (error) {
    console.log(
      "Impossible de récupérer le nombre de followings de l'utilisateur car ",
      error.message
    );
  }
  console.log("--> fin de récupération du nombre de followings");
  return followingsCount;
}

async function getLastConnection(page) {
  console.log("--> début de récupération de la dernière connexion");
  let lastConnection = { date: null, since: null };
  let lastConnectionXPath =
    "//span[contains(text(),'Connect')]/..//span[@title]";

  try {
    let lastConnectionElement = await page.$x(lastConnectionXPath);
    if (lastConnectionElement.length > 0) {
      let dateLastConnection = await lastConnectionElement[0].evaluate(
        (el) => el.innerText
      );
      let dateString = await lastConnectionElement[0].evaluate((el) =>
        el.getAttribute("title")
      );

      lastConnection.date = dateString.split(", ").join("T"); //checker la conversion
      lastConnection.since = dateLastConnection;
    }
    console.log("end of connexion date");
  } catch (error) {
    console.log(
      "Impossible de récupérer la dernière connexion de l'utilisateur car ",
      error.message
    );
  }
  console.log("--> fin de récupération de la dernière connexion");
  return lastConnection;
}

async function getVerified(page) {
  console.log("--> début de récupération des vérifications de profil ");
  let verifications = [];
  let verificationsXPath =
    "//span[contains(text(),'Information')]/..//div[@class='Cell_body__10a_u']";

  try {
    let verficationElements = await page.$x(verificationsXPath);
    for (let verification of verficationElements) {
      let verif = await verification.evaluate((el) => el.innerText);
      verifications.push(verif);
    }
  } catch (error) {
    console.log(
      "Impossible de récupérer les vérifications du profil car ",
      error.message
    );
  }
  console.log("--> fin de récupération des vérifications de profil ");
  return verifications;
}
async function getDescription(page) {
  console.log("--> début de récupération de la description du profil ");
  let description = null;
  let descriptionSectionXPath = "//div[@class='profile__user-description']";
  let shortDescriptionXPath = "./span[1]";
  let moreDescriptionButtonXPath = "./span[@data-testid='more-button']";
  let newDescriptionSectionXPath =
    "//div[@class='profile__user-description']/span";
  let shortDescription = null;

  try {
    let descriptionSection = await page.$x(descriptionSectionXPath);
    if (descriptionSection.length === 1) {
      //récupération de la description courte d'abord
      let shortDescriptionElement = await descriptionSection[0].$x(
        shortDescriptionXPath
      );
      if (shortDescriptionElement.length === 1) {
        shortDescription = await shortDescriptionElement[0].evaluate(
          (el) => el.innerText
        );
        description = shortDescription;
      }
      //alors vérifier si le button existe
      let moreDescriptionButton = await descriptionSection[0].$x(
        moreDescriptionButtonXPath
      );
      if (moreDescriptionButton.length === 1) {
        //alors on clique dessus
        await moreDescriptionButton[0].click();
        await page.waitForTimeout(1000);

        //on récupére la description complète du profil de l'utilisateur

        let newDescriptionSection = await page.$x(newDescriptionSectionXPath);
        if (newDescriptionSection.length === 1) {
          //on s'attend à un élément
          let fullDescription = await newDescriptionSection[0].evaluate(
            (el) => el.innerText
          );
          description = fullDescription;
        }
        // else {
        //   //si plusieurs élément ou aucun élément trouvé, alors on vérifie s'il existe la description courte
        //   description = shortDescription;
        // }
      }
    }
  } catch (error) {
    console.log(
      "Impossible de récupérer la description du profil de l'utilisateur car ",
      error.message
    );
  }
  console.log("--> fin de récupération de la description du profil");
  return description;
}

async function getOffersLinks(page) {
  console.log("--> début de récupération des offres ");
  let offers = [];
  let offersLinkXPath = "//a[@class='ItemBox_overlay__1kNfX']";

  try {
    let offersLink = await page.$x(offersLinkXPath);
    for (let offerLink of offersLink) {
      let offerHasLink = offerLink.evaluate((el) => el.hasAttribute("href"));
      if (offerHasLink) {
        let link = await offerLink.evaluate((el) => el.getAttribute("href"));
        // offers.push(link);
        console.log(offers);
        offers.push(new Offer("https://www.vinted.fr" + link));
      }
    }
  } catch (error) {
    console.log(
      "Impossible de récupérer les offres de l'utilisateur car ",
      error.message
    );
  }
  console.log("--> fin de récupération des offres ");
  return offers;
}

async function startScraping(fromUserPage, address) {
  let user = new User(address);
  try {
    //Récupération du profil de l'utilisateur
    //initialisation d'un objet utilisateur
    console.log("-> Début de récupération des données pour l'utilisateur");

    //Récupération de l'avatar
    user.avatarLink = await getAvatarLink(fromUserPage);

    // Récupération de la notation moyenne
    user.averageScore = await getAverageScore(fromUserPage);

    // Récupération du nombre d'évaluations
    user.assessmentsCount = await getAssessmentsCount(fromUserPage);

    //Récupération de la localisation
    let location = await getUserLocation(fromUserPage);
    user.city = location.city;
    user.country = location.country;

    //Récupération du nombre de followers
    user.followersCount = await getFollowersCount(fromUserPage);

    //Récupération du nombre d'abonnements
    user.followingsCount = await getFollowingsCount(fromUserPage);

    //Récupération de la date de dernière connexion
    let lastConnection = await getLastConnection(fromUserPage);
    user.lastConnectionDate = lastConnection.date;
    user.lastConnectionSince = lastConnection.since;

    //Récupération de l'ensemble des vérifications de profil
    user.verifications = await getVerified(fromUserPage);

    //récupérer la description du profil
    user.description = await getDescription(fromUserPage);

    // Récupération des liens des offres possibles
    user.offers = await getOffersLinks(fromUserPage);
    console.log("-> Fin de récupération des données pour l'utilisateur");
  } catch (error) {
    console.log(error.message);
  }

  return user;
}

// userPageScrapper();
module.exports = userPageScraper;
