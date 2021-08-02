const axios = require("axios");
const fsAsync = require("fs/promises");
const fsSync = require("fs");
const USERS = require("../exports/updatedUsers.json"); // temporaire
// const PICTURES = require("../exports/picturesLocations.json"); // temporaire
const Cloudinary = require("cloudinary").v2;
const Picture = require("../objects/Picture.js");

Cloudinary.config({
  api_key: "252896966134385",
  cloud_name: "dkgzv7huz",
  api_secret: "ooHcO7Y2UwUEzGBDpLJfojaI4dA",
  // secure: true,
});

main(USERS);
async function main(users) {
  //Télécharger les images à partir de Vinted
  let pics = await downloadImages(users);
  //Sauvegarde des users en json après téléchargement des images de Vinted
  let localPicsStringyfied = JSON.stringify(users, null, 2);
  fsSync.writeFile(
    "./exports/usersLocalLocations.json",
    localPicsStringyfied,
    (error) => {
      console.log("error while writing");
    }
  );
  //Télécharger les images sur Cloudinary
  // await uploadToCloudinary(pics);
  await uploadToCloudinary(users);
  //Sauvegarde des users après téléchargement des images sur Cloudinary
  let cloudinaryPicsStringyfied = JSON.stringify(users, null, 2);
  fsSync.writeFile(
    "./exports/usersCloudinaryLocations.json",
    cloudinaryPicsStringyfied,
    (error) => {
      console.log("error while writing");
    }
  );
}

async function uploadToCloudinary(users) {
  //Charge l'ensemble des images sur Cloudinary
  try {
    console.log("Début du transfert des images sur cloudinary");

    for (let user of users) {
      //télécharger sur cloudinary l'avatar et mettre à jour les données de l'avatar
      if (user.downloadedAvatar) {
        user.uploadedAvatar = await uploadPictureToCloudinary(
          user.downloadedAvatar
        );
      }

      for (let offer of user.offers) {
        //Télécharger pour chaque offre les images sur Cloudinary et les mettre à jour
        offer.uploadedPictures = [];
        for (let downlodedPic of offer.downloadedPictures) {
          let uploadedPicture = await uploadPictureToCloudinary(downlodedPic);
          offer.uploadedPictures.push(uploadedPicture);
        }
      }
    }
  } catch (error) {
    console.log("Les images n'ont pu être chargées sur Cloudinary");
    console.log("Car:", error.message);
  }
  console.log("Fin du transfert des images sur Cloudinary");
}

// async function uploadToCloudinary(picturesLocations) {
//   //Charge l'ensemble des images sur Cloudinary
//   try {
//     console.log("Début du transfert des images sur cloudinary");

//     for (let pic of picturesLocations) {
//       await uploadPictureToCloudinary(pic);
//     }
//   } catch (error) {
//     console.log("Les images n'ont pu être chargées sur Cloudinary");
//     console.log("Car:", error.message);
//   }
//   console.log("Fin du transfert des images sur Cloudinary");
// }

async function uploadPictureToCloudinary(picture) {
  //Charge une seule image sur Cloudinary
  console.log(
    `Début du chargement de l'image (${picture.fullLocalPath}) sur cloudinary`
  );

  let uploadedPicture = null;
  try {
    //Construction du chemin de sauvegarde de l'image dans Cloudinary
    let splittedFullPath = picture.fullLocalPath.split("/");
    let startingPathPosition = splittedFullPath.indexOf("images");
    let imageFolderPath = "";
    if (startingPathPosition) {
      imageFolderPath =
        "Vinted/by_users_" +
        splittedFullPath
          .slice(startingPathPosition, splittedFullPath.length - 1)
          .join("/");
    }
    console.log("Répetoire cloudinary de l'image:", imageFolderPath);
    let response = await Cloudinary.uploader.upload(picture.fullLocalPath, {
      folder: imageFolderPath,
      public_id: picture.name,
    });

    uploadedPicture = { ...picture };
    uploadedPicture.cloudinaryDescriptors = response;
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
  return uploadedPicture;
}

async function downloadImages(users) {
  let pictures = [];
  try {
    let cb = (err) => {
      if (err) throw err;
    };
    // Création du dossier d'images
    let imagesDirectoryRelativePath = "/exports/images";
    // let imagesDirectoryFullPath =
    await createDirectory(imagesDirectoryRelativePath);
    console.log(
      `Le dossier ${imagesDirectoryRelativePath} sera destiné au téléchargement des images.`
    );
    for (let user of users) {
      //Création d'un dossier pour chaque utilisateur

      let userId = user.profilLink.split("/").pop().split("-")[0]; //identifiant vinted
      let userDirectoryRelativePath =
        imagesDirectoryRelativePath + "/user_" + userId; // chemin relative du dossier
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
      let avatarRelativPath = "/avatar_pic_" + userId + ".jpeg";
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
        user.downloadedAvatar = avatar;
      }

      for (let offer of user.offers) {
        offer.downloadedPictures = [];
        let offerId = offer.link.split("/").pop().split("-")[0];
        let offerDirectoryRelativePath =
          userDirectoryRelativePath + "/offer_" + offerId;
        let offerDirectoryFullPath = await createDirectory(
          offerDirectoryRelativePath
        );
        let pictureId = 0;
        for (let pic of offer.pictures) {
          let picture = new Picture(pic);
          let pictureRelativePath = "/item_pic_" + pictureId + ".jpeg";
          let pictureFullPath = offerDirectoryFullPath + pictureRelativePath;
          await createImage(picture, pictureFullPath);
          pictureId = pictureId + 1;
          if (picture.fullLocalPath) {
            pictures.push(picture);
            offer.downloadedPictures.push(picture);
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
  return pictures;
}

async function createImage(picture, toImageFullPath) {
  //Récupère l'image sur le site de Vinted et les enregistrent en local

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

async function createDirectory(relativePath) {
  //Fonction pour créer un répertoire à la racine du projet
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
