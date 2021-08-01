const axios = require("axios");
const FileSystem = require("fs");
const Path = require("path");

const URL =
  "https://images1.vinted.net/t/03_00094_RRBTLPjHg47SLZhPq5NufD5r/f800/1627754772.jpeg?s=5a45c67c00a9e96e0789e9639d49672f94e59126";

//   "https://www.google.com/imgres?imgurl=https%3A%2F%2Fpost.medicalnewstoday.com%2Fwp-content%2Fuploads%2Fsites%2F3%2F2020%2F02%2F322868_1100-800x825.jpg&imgrefurl=https%3A%2F%2Fwww.medicalnewstoday.com%2Farticles%2F322868&tbnid=SMMlmWDadP14fM&vet=12ahUKEwjcyPWi8Y_yAhURahoKHQ2rA4cQMygAegUIARCrAQ..i&docid=_RVRngRfeprTTM&w=800&h=825&q=dog&hl=FR&ved=2ahUKEwjcyPWi8Y_yAhURahoKHQ2rA4cQMygAegUIARCrAQ";

async function download(url, toFile) {
  try {
    let response = await axios.get(url, { responseType: "stream" });
    const path = Path.resolve("./exports", "code.jpeg");
    const writer = FileSystem.createWriteStream(path);
    response.data.pipe(writer);

    console.log(response);
    console.log(response.data);
    console.log("Fin download");
  } catch (error) {
    console.log(error.message);
  }
}

async function createfile() {
  await FileSystem.mkdir("./exports/images", (err) => {
    if (err) throw err;
  });
}
createfile();
// download(URL);
module.exports = download;
