const fs = require("fs");
const data = require("./UsersLinks.json");

// let ob1 = { n: "éayoub", age: 23 };
// let ob2 = { n: "äâêôsarah", age: 18 };
// let ob3 = { n: "5/QZA¨", age: 16 };
// let table = [ob3, ob1, ob2];
// let myJSONString = JSON.stringify(table, null, 2);
// console.log(typeof myJSONString);

// fs.writeFile("object.json", myJSONString, (error) => {
//   console.log(error.message);
// });

// console.log(data);
for (let el of data) {
  console.log(el);
  console.log(el.profilLink);
}
