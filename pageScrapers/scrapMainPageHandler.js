async function scrapMainPage(page) {
  //récupérer la balise contenant l'ensemble des données
  let offersContainerMarkUp = "div.feed-grid";

  let offersContainer = await page.$(offersContainerMarkUp);
  //récupérer les dressing vitrines
  try {
    let usersByPromotedUsers = await getPromotedUsers(offersContainer);
    let usersByPromotedOffers = await getPromotedOffers(offersContainer);
  } catch (error) {
    console.log(error.message);
  }
}

async function getPromotedUsers(offersContainer) {
  let users = [];
  try {
    let promotedUsersMarkUp =
      "div.feed-grid__item--full-row div.closet-container";

    let promotedUsers = await offersContainer.$$(promotedUsersMarkUp);

    for (let i = 0; i < promotedUsers.length; i++) {
      //récupération de l'avatar de l'utilisateur
      let userAvatarMarkUp = "div.Cell_image__3kOWg img";
      let userHasAvatar = await promotedUsers[i].$eval(
        userAvatarMarkUp,
        (element) => element.hasAttribute("src")
      );
      let userAvatar = null;
      if (userHasAvatar) {
        userAvatar = await promotedUsers[i].$eval(userAvatarMarkUp, (element) =>
          element.getAttribute("src")
        );
      }

      console.log(userAvatar);

      //Récupération du lien vers le profil de l'utilisateur
      let userProfilMarkUp = "div.Cell_image__3kOWg a";
      let userProfilMarkUpHasLink = await promotedUsers[i].$eval(
        userProfilMarkUp,
        (element) => element.hasAttribute("href")
      );
      let userProfilLink = null;
      if (userProfilMarkUpHasLink) {
        userProfilLink = await promotedUsers[i].$eval(
          userProfilMarkUp,
          (element) => element.getAttribute("href")
        );
      }
      console.log(userProfilLink);

      //Récupération du rating de l'utilisateur
      let ratingMarkUp = "div.Rating_star__4M91J";
      let ratingScore = await (await promotedUsers[i].$$(ratingMarkUp)).length;
      console.log(ratingScore);

      //Récupération du nombre d'évaluations
      let assessmentsCountMarkUp =
        "div.Rating_label__Do7Nn span.Text_text__QBn4-";
      let assessmentsCount = await promotedUsers[i].$eval(
        assessmentsCountMarkUp,
        (element) => element.innerHTML
      );

      console.log(assessmentsCount);
      //récupération des informations des offres promus pour un utilisateur
      let userPromotedOffersMarkUp = "div.ItemBox_box__2xrHH";
      let userPromotedOffers = await promotedUsers[i].$$(
        userPromotedOffersMarkUp
      );
      let offers = [];
      console.log(userPromotedOffers);
      for (let offer of userPromotedOffers) {
        let offerMarkup = "a";
        let offerHasLink = await offer.$eval(offerMarkup, (element) =>
          element.hasAttribute("href")
        );
        let userOfferLink = null;
        if (offerHasLink) {
          userOfferLink = await offer.$eval(offerMarkup, (element) =>
            element.getAttribute("href")
          );
          offers.push("https://www.vinted.fr" + userOfferLink);
        }
        console.log(userOfferLink);
      }
      console.log(offers);
    }
  } catch (error) {
    console.log(error.message);
  }
  return users;
}

async function getPromotedOffers(offersContainer) {
  try {
    let promotedOffersMarkUp = "div.feed-grid__item--one-fifth";
    let promotedOffers = await offersContainer.$$(promotedOffersMarkUp);
    console.log(promotedOffers);
    for (let promotedOffer of promotedOffers) {
      console.log(promotedOffer);
      let userProfilMarkup = "div.ItemBox_owner__3kopM a";
      let userHasProfilLink = await promotedOffer.$eval(
        userProfilMarkup,
        (element) => element.hasAttribute("href")
      );
      let userProfilLink = null;
      if (userHasProfilLink) {
        userProfilLink = await promotedOffer.$eval(
          userProfilMarkup,
          (element) => element.getAttribute("href")
        );
      }
      console.log(userProfilLink);
    }
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = scrapMainPage;
