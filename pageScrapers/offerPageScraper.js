const puppeteer = require("puppeteer");
const Offer = require("../objects/Offer.js");
const PARAMS = require("../settings/parameters.json");

// const address =
//   "https://www.vinted.fr/femmes/sacs/sacs-a-main/574233378-sac-cabas-emporio-armani";

// scrapOfferPage(address);

async function scrapOfferPage(address) {
  let offer = null;
  const browser = await puppeteer.launch({ headless: false });
  console.log("Récupération de l'offre:", address);

  try {
    let page = await browser.newPage();
    console.log("nouvelle page ouverte");

    await page.setViewport({ width: 1200, height: 800 });
    console.log("view port set");

    await page.goto(address, {
      waitUntil: "networkidle2",
    });
    await page.waitForTimeout(4000);

    console.log("chargement de la page de l'offre terminé: ", address);
    offer = await startScrapping(page, address);
    // console.log(offer);
  } catch (error) {
    console.log(error.message);
  }

  await browser.close();
  return offer;
}

async function startScrapping(fromOfferPage, address) {
  console.log("-> Début de scraping de l'offre");
  let offer = new Offer(address);
  try {
    offer.pictures = await getPicturesLink(fromOfferPage);
    offer.basePriceEuros = await getBasePrice(fromOfferPage);
    offer.shippingPrices = await getShippingPrices(fromOfferPage);
    offer.descriptors = await getDescriptors(fromOfferPage);
    offer.title = await getTitle(fromOfferPage);
    offer.description = await getDescription(fromOfferPage);
  } catch (error) {
    console.log(error.message);
  }
  // console.log("-> Fin de scraping de l'offre");
  return offer;
}

async function getPicturesLink(page) {
  console.log("--> début de récupération des liens vers les images");
  let picturesLinks = [];
  let picturesXPath = "//div[@class='item-photos']/./figure/./a";

  try {
    let picturesElements = await page.$x(picturesXPath);
    for (let pictureElement of picturesElements) {
      let pictureLink = await pictureElement.evaluate((el) =>
        el.getAttribute("href")
      );
      pictureLink && picturesLinks.push(pictureLink);
    }
    if (picturesLinks.length > PARAMS.MAX_IMAGES_PER_OFFER) {
      picturesLinks = picturesLinks.slice(0, PARAMS.MAX_IMAGES_PER_OFFER);
    }

    // console.log("--> fin de récupération des liens vers les images");
  } catch (error) {
    console.log(
      "Impossible de récupérer les liens vers les images car ",
      error.message
    );
  }

  return picturesLinks;
}

async function getBasePrice(page) {
  console.log("--> début de récupération du prix de base");
  let basePrice = null;
  let basePriceXPath =
    "//div[@class='details-list__item details-list--price']/.//div";

  try {
    let priceElement = await page.$x(basePriceXPath);
    if (priceElement.length === 1) {
      let priceString = await priceElement[0].evaluate((el) => el.innerText);
      basePrice = Number(priceString.split(" ")[0].replace(",", "."));
    }
  } catch (error) {
    console.log("Impossible de récupérer le prix de base car ", error.message);
  }
  // console.log("--> fin de récupération du prix de base");

  return basePrice;
}

async function getShippingPrices(page) {
  console.log("--> début de récupération des prix d'acheminement");
  let shippingPrices = [];
  let shippingMeanContainerXPath =
    "//div[@class='details-list__item details-list--badges']/.//div[@class='Cell_content__2bRVC']";
  let shippingDataXPath = ".//span";
  try {
    let shippingContainersElements = await page.$x(shippingMeanContainerXPath);
    for (let shippingElement of shippingContainersElements) {
      let shippingDatasElements = await shippingElement.$x(shippingDataXPath);
      if (shippingDatasElements.length === 2) {
        let shippingProvider = await shippingDatasElements[0].evaluate(
          (el) => el.innerText
        );
        let shippingPriceString = await shippingDatasElements[1].evaluate(
          (el) => el.innerText
        );
        // console.log(shippingPriceString);
        let re = new RegExp(String.fromCharCode(160), "g");
        let shippingPrice = {
          provider: shippingProvider,
          price: Number(
            shippingPriceString.replace(re, "/").replace(",", ".").split("/")[0]
          ),
        };
        shippingPrices.push(shippingPrice);
      }
    }
  } catch (error) {
    console.log(
      "Impossible de récupérer les prix d'acheminement car ",
      error.message
    );
  }
  // console.log("--> fin de récupération des prix d'acheminement");

  return shippingPrices;
}

async function getDescriptors(page) {
  console.log("--> début de récupération des propriétés de l'objet en vente");
  let descriptors = [];
  let descriptorTypeContainersXPath =
    "//div[@class='details-list__item-title']";
  let descriptorValueContainersXPath =
    "//div[@class='details-list__item-value']";

  try {
    let descriptorTypeContainersElement = await page.$x(
      descriptorTypeContainersXPath
    );
    let descriptorValueContainersElement = await page.$x(
      descriptorValueContainersXPath
    );

    if (
      descriptorTypeContainersElement.length ===
      descriptorValueContainersElement.length
    ) {
      for (let i = 0; i < descriptorTypeContainersElement.length; i++) {
        let descriptorType = await descriptorTypeContainersElement[i].evaluate(
          (el) => el.innerText
        );
        let descriptorValueXPath = ".//span";
        let descriptorValueElement = await descriptorValueContainersElement[
          i
        ].$x(descriptorValueXPath);
        if (descriptorValueElement.length === 1) {
          let descriptorValue = await descriptorValueElement[0].evaluate(
            (el) => el.innerText
          );
          descriptors.push({ type: descriptorType, value: descriptorValue });
        } else if (descriptorValueElement.length === 0) {
          let descriptorValue = await descriptorValueContainersElement[
            i
          ].evaluate((el) => el.innerText);
          descriptors.push({ type: descriptorType, value: descriptorValue });
        }
      }
    }
  } catch (error) {
    console.log(
      "Impossible de récupérer les propriétés de l'objet en vente car ",
      error.message
    );
  }
  // console.log("--> fin de récupération des propriétés de l'objet en vente");

  return descriptors;
}

async function getTitle(page) {
  console.log("--> début de récupération le titre de l'offre");
  let title = null;
  let titleXPath =
    "//div[@class='details-list details-list--info']/.//div[@itemprop='name']/span";

  try {
    let titleElement = await page.$x(titleXPath);
    title = await titleElement[0].evaluate((el) => el.innerText);
  } catch (error) {
    console.log(
      "Impossible de récupérer le titre de l'offre car ",
      error.message
    );
  }
  // console.log("--> fin de récupération le titre de l'offre");

  return title;
}

async function getDescription(page) {
  console.log("--> début de récupération de la description globale");
  let description = null;
  let descriptionXPath =
    "//div[@class='details-list details-list--info']/.//div[@itemprop='description']/span/span";

  try {
    let descriptionElement = await page.$x(descriptionXPath);
    description = await descriptionElement[0].evaluate((el) => el.innerText);
  } catch (error) {
    console.log(
      "Impossible de récupérer la description globale car ",
      error.message
    );
  }
  // console.log("--> fin de récupération de la description globale");

  return description;
}

module.exports = scrapOfferPage;
