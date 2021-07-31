const puppeteer = require("puppeteer");
const User = require("./User.js");

const FileSystem = require("fs");

const ADDRESS = "https://www.vinted.fr/";

async function getVintedMainPage() {
  console.log("initalisation du get");
  try {
    console.log("création du browser");
    let browser = await puppeteer.launch({ headless: false });

    let page = await browser.newPage();
    console.log("nouvelle page créée");

    await page.setViewport({ width: 1200, height: 800 });
    console.log("view port set");

    await page.goto(ADDRESS, { waitUntil: "networkidle2" });
    console.log("chargement terminé");

    await page.click("#onetrust-accept-btn-handler");
    console.log("cookie accepté");
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      return document.body.scrollHeight;
    });
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      return document.body.scrollHeight;
    });
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      return document.body.scrollHeight;
    });

    await loadFullPage(page);

    console.log("Début de récupération des balises");

    await page.waitForTimeout(4000);
    //Récupérer les balises

    let users = await scrapMainPage(page);
    FileSystem.writeFile(
      "UsersLinks.json",
      JSON.stringify(users, null, 2),
      (error) => {
        console.log(error.message);
      }
    );

    console.log("fin de récupération des balises");

    console.log("fin");
    await browser.close();
    console.log("browser fermé");
    //
  } catch (error) {
    console.log("Une erreur est survenue");
    console.log(error.message);
  }
  await browser.close();
}

// Scraps the main page
async function scrapMainPage(page) {
  //récupérer la balise contenant l'ensemble des données
  let offersContainerMarkUp = "div.feed-grid";

  let offersContainer = await page.$(offersContainerMarkUp);
  //récupérer les dressing vitrines
  let usersFound = [];
  try {
    let usersByPromotedUsers = await getPromotedUsers(offersContainer);
    let usersByPromotedOffers = await getPromotedOffers(offersContainer);
    usersFound = [...usersByPromotedUsers, ...usersByPromotedOffers];
  } catch (error) {
    console.log(error.message);
  }
  return usersFound;
}

async function getPromotedUsers(offersContainer) {
  let users = [];
  try {
    let promotedUsersMarkUp =
      "div.feed-grid__item--full-row div.closet-container";

    let promotedUsers = await offersContainer.$$(promotedUsersMarkUp);

    for (let i = 0; i < promotedUsers.length; i++) {
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
        console.log(userProfilLink);
        let user = new User(userProfilLink);
        console.log(user);
        users.push(user);
        console.log(users);
      }
    }
  } catch (error) {
    console.log(error.message);
  }
  return users;
}

async function getPromotedOffers(offersContainer) {
  let users = [];
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
        console.log(userProfilLink);
        let user = new User(userProfilLink);
        console.log(user);
        users.push(user);
        console.log(users);
      }
    }
  } catch (error) {
    console.log(error.message);
  }
  return users;
}

async function loadFullPage(page) {
  // scroller jusqu'à la fin de la page et attendre la fin du chargement
  console.log("Début du chargmement de la page");
  let currentHeight = 0; //spécifie la hauteur du body actuel
  let newHeight = 0; // spécifie la hauteur du body suite à l'exécution d'un scroll
  let scroll = true; // est à false lorsqu'on a atteint la fin de la page selon l'axe des y (fin horizontale de la page)
  let scrollsCount = 0; // compte le nombre de scrolls effectués
  let numberOfConsecutiveErrors = 0; // permet d'arrêter la boucle en cas de scroll générant plusieurs erreurs à la suite
  let maxOfConsecutiveErrors = 10; // maximum d'erreurs successives possibles --> à mettre en paramètre d'entrée
  while (scroll) {
    try {
      numberOfConsecutiveErrors = 0;
      // récupèrer la nouvelle hauteur de la page
      newHeight = await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
        return document.body.scrollHeight;
      });
      if (newHeight > currentHeight) {
        // si la nouvelle hauteur est différente alors des nouvelles datas ont été chargées qu'on souhaite récupérer par la suite dans ce cas :
        // --> on met à jour notre ancienne hauteur
        currentHeight = newHeight;
        // --> on souhaite scroller une nouvelle fois
        scrollsCount += 1;
        // --> et on attend le chargement des nouvelles données
        await page.waitForTimeout(1000);
      } else {
        // si la nouvelle hauteur est égale à la hauteur précédente alors l'ensemble des données on été chargées dans le body et on peut commencer l'extraction des datas :
        // --> on arrête de scoller :
        scroll = false;
        // --> on ajuste le nombre scroll car on en aura fait un de plus : scroll -=1
        scrollsCount -= 1;
      }
      console.log(
        "Numéro d'itération:",
        scrollsCount,
        "et nouvelle hauteur de body atteinte:",
        newHeight
      );
    } catch (error) {
      numberOfConsecutiveErrors += 1;
      console.log(
        `Erreur ${numberOfConsecutiveErrors} générées lors du scroll`
      );
      console.log("Message d'erreur lors du scroll:", error.message);
      if (numberOfConsecutiveErrors === maxOfConsecutiveErrors) {
        //nombre d'erreurs consécutives atteint on doit sortir de la boucle while
        scroll = false;
      }
    }
    console.log(`Fin du scroll numéro ${scrollsCount}`);
  }
}

getVintedMainPage();
