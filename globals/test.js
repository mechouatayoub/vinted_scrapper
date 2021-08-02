// const dotEnv = require("dotenv").config({
//   path: `${process.cwd()}/cloudinary.env`,
// });

console.log("in the test file");
console.log(
  process.env.MONGODB_USERNAME,
  process.env.MONGODB_PASSWORD,
  process.env.CLOUDINARY_CLOUD_NAME
);
