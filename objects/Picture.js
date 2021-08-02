function Picture(originalURL) {
  this.originalURL = originalURL;
  this.fullLocalPath = null;
  this.relativeLocalPath = null;
  this.name = null;
  this.extension = null;
  this.cloudinaryDescriptors = null;
}

module.exports = Picture;
