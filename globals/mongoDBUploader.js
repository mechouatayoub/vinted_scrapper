// avec Node JS = mongodb + srv://<username>:<password>@cluster0.kz885.mongodb.net/<myFirstDatabase>?retryWrites=true&w=majority
// avec Compass = mongodb+srv://<username>:<password>@cluster0.kz885.mongodb.net/test

const SETTINGS = require("../settings/parameters.json");
const mongoose = require("mongoose");
const dotEnv = require("dotenv").config();
// const users = require("../exports/usersCloudinaryLocations.json");

const SHA256 = require("crypto-js/sha256");
const uid2 = require("uid2");
const encBase64 = require("crypto-js/enc-base64");

// console.log(dotEnv);

// main(users);

async function main(users) {
  await mongoose.connect(
    `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.kz885.mongodb.net/${SETTINGS.MONGODB_NAME}?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true }
  );
  await persistUsers(users);
  await persistProducts(users);
}

async function persistUsers(users) {
  for (let user of users) {
    await persistUser(user);
  }
}

async function persistUser(user) {
  try {
    let userD = new UserE();
    userD.userName = user.nickName;
    userD.email = user.nickName + "@gmail.com";
    userD.vintedLink = user.profilLink;
    userD.avatar = user.uploadedAvatar;
    userD.assessmentsCount = user.assessmentsCount;
    userD.averageScore = user.averageScore;
    userD.city = user.city;
    userD.country = user.country;
    userD.followersCount = user.followersCount;
    userD.followingsCount = user.followingsCount;
    user.lastConnectionDate = user.lastConnectionDate;
    userD.verifiedBy = user.verifications;
    userD.description = user.description;
    let salt = uid2(16);
    userD.hash = SHA256(salt).toString(encBase64);
    userD.salt = salt;
    userD.token = uid2(16);
    await userD.save();
  } catch (error) {
    console.log(
      `L'utilisateur ${user.nickName} n'a pu être persisté en base de données`
    );
    console.log(`Car:`, error.message);
  }
}

async function persistProducts(users) {
  for (let user of users) {
    for (let offer of user.offers) {
      await persistProduct(offer, user.nickName);
    }
  }
}

async function persistProduct(product, userName) {
  try {
    // chercher le créateur de l'annonce
    let productCreator = await UserE.findOne({ userName: userName });
    //chercher le créateur du commentaire
    let newComments = [];
    for (let comment of product.comments) {
      let productEvaluator = await UserE.findOne({
        userName: comment.username,
      });
      newComments.push({
        user: productEvaluator,
        comment: comment.comment,
        score: comment.score,
      });
    }
    let productD = new Product();
    productD.title = product.title;
    productD.description = product.description;
    productD.vintedLink = product.link;
    productD.basePriceEuros = product.basePriceEuros;
    productD.shippingAlternatives = product.shippingPrices;
    productD.details = product.descriptors;
    productD.pictures = product.uploadedPictures;
    productD.usersComments = newComments;
    productD.user = productCreator;
    await productD.save();
  } catch (error) {
    console.log(
      `L'offre ${product.title} n'a pu être persisté en base de données.`
    );
    console.log(error.message);
  }
}

//Configuration du modèle et schéma user
const userS = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  vintedLink: { type: String, default: "" },
  avatar: { type: Object, default: null },
  phone: { type: String, default: "" },
  assessmentsCount: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  city: { type: String, default: "" },
  country: { type: String, default: "" },
  followersCount: { type: Number, default: 0 },
  followingsCount: { type: Number, default: 0 },
  lastConnectionDate: {
    type: Date,
    default: Date.now,
  },
  verifiedBy: { type: [{ type: String }], default: null },
  description: { type: String, default: "" },
  hash: { type: String, unique: true, required: true },
  salt: { type: String, unique: true, required: true },
  token: { type: String, unique: true, required: true },
});

const UserE = mongoose.model("User", userS);

//Définition de la collection de produit
const productS = mongoose.Schema({
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  vintedLink: {
    type: String,
    default: "",
  },
  basePriceEuros: {
    type: Number,
    default: 0,
  },
  shippingAlternatives: [
    {
      provider: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        default: 0,
      },
    },
  ],
  details: [
    {
      type: { type: String, default: "" },
      value: { type: String, default: "" },
    },
  ],
  pictures: [
    {
      originalURL: { type: String, default: "" },
      fullLocalPath: { type: String, default: "" },
      relativeLocalPath: { type: String, default: "" },
      name: { type: String, default: "" },
      extension: { type: String, default: "" },
      cloudinaryDescriptors: { type: Object },
    },
  ],
  usersComments: [
    {
      username: { type: String, default: "" },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      comment: { type: String, default: "" },
      score: { type: Number, default: 0 },
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

const Product = mongoose.model("Product", productS);

module.exports = main;
