const PARAMS = require("../settings/parameters.json");
const data = require("../settings/commentsSamples.json");
function generateComments() {
  const maxComments = PARAMS.MAX_COMMENTS_PER_VENDOR;
  const comments = [];
  const commentsToGenerate = Math.trunc(Math.random() * maxComments + 1);
  for (let i = 0; i < commentsToGenerate; i++) {
    comments.push(data[i]);
    console.log(data[i]);
  }
  console.log(comments);
  return comments;
}

// generateComments();
module.exports = generateComments;
