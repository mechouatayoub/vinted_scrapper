const axios = require("axios");
const fsAsync = require("fs/promises");
const fsSync = require("fs");
const USERS = require("../exports/updatedUsers.json"); // temporaire
const PICTURES = require("../exports/picturesLocations.json"); // temporaire
const Cloudinary = require("cloudinary").v2;
const Picture = require("../objects/Picture.js");

Cloudinary.config({
  api_key: "252896966134385",
  cloud_name: "dkgzv7huz",
  api_secret: "ooHcO7Y2UwUEzGBDpLJfojaI4dA",
  // secure: true,
});

async function uploadToCloudinary(picturesLocations) {
  try {
    console.log("Début de chargement sur cloudinary des images");

    for (let pic of picturesLocations) {
      await uploadPictureToCloudinary(pic);
    }
    let picsStringyfied = JSON.stringify(PICTURES, null, 2);
    fsSync.writeFile(
      "./exports/picturesCloudinaryLocations.json",
      picsStringyfied,
      (error) => {
        console.log("error while writing");
      }
    );
    console.log("end");
  } catch (error) {
    console.log(error.message);
  }
}

uploadToCloudinary(PICTURES);
async function uploadPictureToCloudinary(picture) {
  console.log(
    `Début de chargement de l'image (${picture.fullLocalPath}) sur cloudinary`
  );
  try {
    let splittedFullPath = picture.fullLocalPath.split("/");
    let startingPathPosition = splittedFullPath.indexOf("images");
    let imageFolderPath = "";
    if (startingPathPosition) {
      imageFolderPath =
        "Vinted/" +
        splittedFullPath
          .slice(startingPathPosition, splittedFullPath.length - 1)
          .join("/");
    }
    console.log("Répetoire cloudinary de l'image:", imageFolderPath);
    let response = await Cloudinary.uploader.upload(picture.fullLocalPath, {
      folder: imageFolderPath,
      public_id: picture.name,
    });

    picture.cloudinaryDescriptors = response;
    console.log(picture);
  } catch (error) {
    FolderPath;
    console.log(
      `Impossible de charger l'image (${picture.fullLocalPath}) sur cloudinary`
    );
    console.log("Car:", error.message);
  }
  console.log(
    `Fin de chargement de l'image (${picture.fullLocalPath}) sur cloudinary`
  );
}

// async function testCloudinary() {
//   console.log(PICTURES[1]);
//   await uploadPictureToCloudinary(PICTURES[1]);
// }

// testCloudinary();

async function createDirectory(relativePath) {
  //fonction pour créer un répertoire
  let directoryPath = null;
  let tempDirectoryPath = cdPath() + relativePath;
  try {
    await fsAsync.mkdir(tempDirectoryPath, { recursive: true }); // si le répertoire existe le contenu n'est pas modifié
    directoryPath = tempDirectoryPath;

    console.log(`Répertoire ${directoryPath} a été crée.`);
  } catch (error) {
    console.log(
      `Répertoire ${tempDirectoryPath} n'a pas été créé car : ${error.message}`
    );
  }
  console.log("Fin de la fonction de création de répertoire");
  return directoryPath;
}

function cdPath() {
  //Récupère le chemin d'accès au répertoire du projet
  return process.cwd();
}

// createDirectory("/images3");

async function createImage(picture = new Picture(), toImageFullPath) {
  //Récupère l'image sur internet et l'écri à l'endroit souhaité

  console.log(
    `--->Début d'éxcution pour ${
      toImageFullPath.split("/")[toImageFullPath.split("/").length - 1]
    }`
  );

  try {
    console.log(`Début de création (${picture.originalURL})`);
    let response = await axios.get(picture.originalURL, {
      responseType: "stream",
    });
    let data = response.data;
    console.log(`Requête axios vers (${picture.originalURL}) a réussie`);
    const writer = fsSync.createWriteStream(toImageFullPath);
    data.pipe(writer); // ne comprends cette écriture mais ca fonctionne

    //mise à jour des données de la photo;
    picture.fullLocalPath = toImageFullPath;
    picture.relativeLocalPath =
      "/" + toImageFullPath.split("/")[toImageFullPath.split("/").length - 1];
    picture.extension = picture.relativeLocalPath.split(".")[1];
    picture.name = picture.relativeLocalPath.split(".")[0].replace("/", "");
    console.log(`Fichier (${toImageFullPath}) a été crée.`);
  } catch (error) {
    console.log(`Le fichier (${toImageFullPath}) n'a pa été crée.`);
    console.log(`Car : ${error.message}`);
  }
  console.log(
    `->Fin d'éxecution pour (${
      toImageFullPath.split("/")[toImageFullPath.split("/").length - 1]
    })`
  );

  let timeSeed = Math.trunc(Math.random() * 2000);
  setTimeout(() => {
    console.log("Waiting for loading the next picture");
    console.log("-> Break time:", timeSeed, "ms");
  }, timeSeed);
}

async function downloadImages(users) {
  let pictures = [];
  try {
    let cb = (err) => {
      if (err) throw err;
    };
    // Création du dossier d'images
    let imagesDirectoryRelativePath = "/images";
    // let imagesDirectoryFullPath =
    await createDirectory(imagesDirectoryRelativePath);
    console.log(
      `Le dossier ${imagesDirectoryRelativePath} sera destiné au téléchargement des images.`
    );
    for (let user of users) {
      //Création d'un dossier pour chaque utilisateur

      let userId = user.profilLink.split("/").pop().split("-")[0]; //identifiant vinted
      let userDirectoryRelativePath =
        imagesDirectoryRelativePath + "/" + userId; // chemin relative du dossier
      let userDirectoryFullPath = await createDirectory(
        userDirectoryRelativePath
      );
      console.log(`Le dossier ${userDirectoryFullPath} a été crée.`);
      console.log(
        `Début du téléchagement des assets pour l'utilisateur ${user.nickName} / id: ${userId}`
      );
      console.log(
        `Lien de l'avatar pour le téléchargement : ${user.avatarLink}`
      );

      //téléchargement de l'avatar dans le dossier
      let avatarRelativPath = "/" + userId + ".jpeg";
      let avatarFullPath = userDirectoryFullPath + avatarRelativPath;
      let avatarLink = user.avatarLink;
      if (user.avatarLink === "/assets/no-photo/user-empty-state.svg") {
        avatarLink =
          "https://www.vinted.fr/assets/no-photo/user-empty-state.svg";
      }
      let avatar = new Picture(avatarLink);
      await createImage(avatar, avatarFullPath);
      if (avatar.fullLocalPath) {
        pictures.push(avatar);
      }

      for (let offer of user.offers) {
        let offerId = offer.link.split("/").pop().split("-")[0];
        let offerDirectoryRelativePath =
          userDirectoryRelativePath + "/" + offerId;
        let offerDirectoryFullPath = await createDirectory(
          offerDirectoryRelativePath
        );
        let pictureId = 0;
        for (let pic of offer.pictures) {
          let picture = new Picture(pic);
          let pictureRelativePath = "/" + pictureId + ".jpeg";
          let pictureFullPath = offerDirectoryFullPath + pictureRelativePath;
          await createImage(picture, pictureFullPath);
          pictureId = pictureId + 1;
          if (picture.fullLocalPath) {
            pictures.push(picture);
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
  return pictures;
}

async function main() {
  let pics = await downloadImages(USERS);
  console.log(pics);
  let picsStringyfied = JSON.stringify(pics, null, 2);
  fsSync.writeFile(
    "./exports/picturesLocations.json",
    picsStringyfied,
    (error) => {
      console.log("error while writing");
    }
  );
}

// main();

// async function test() {
//   // let picture1 = new Picture(
//   //   "https://images1.vinted.net/t/03_00094_RRBTLPjHg47SLZhPq5NufD5r/f800/1627754772.jpeg?s=5a45c67c00a9e96e0789e9639d49672f94e59126"
//   // );
//   // let picture2 = new Picture(
//   //   "https://images1.vinted.net/t/03_00823_MhZx3DrfkVjUcwDHxitQBceP/f800/1627743474.jpeg?s=0ad2c5acabfa3784e6ba4c6cece97fc632c47dd8"
//   // );
//   let picture3 = new Picture(
//     "https://images1.vinted.net/t/03_0171b_HhbMfsP2FCWsagXnhow76PWd/f800/1621362749.jpeg?s=403f5da0ebd0420b968eb2583093804d60f2ae99"
//   );
//   // await createImage(
//   //   picture1,
//   //   "/Users/ayoubmechouat/LeReacteur/S_React/S2/OnTime/Vinted/scrapper/images3/im1.jpeg"
//   // );

//   // await createImage(
//   //   picture2,
//   //   "/Users/ayoubmechouat/LeReacteur/S_React/S2/OnTime/Vinted/scrapper/images3/im2.jpeg"
//   // );
//   await createImage(
//     picture3,
//     "/Users/ayoubmechouat/LeReacteur/S_React/S2/OnTime/Vinted/scrapper/images/29803536/29803536.jpg"
//   );
//   // console.log("image 1:", picture1);
//   // console.log("image 2:", picture2);
//   console.log("image 3:", picture3);
//   console.log("fin");
// }

// test();
