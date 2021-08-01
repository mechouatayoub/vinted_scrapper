function User(profilLink) {
  //properties
  this.profilLink = profilLink;
  this.nickName = profilLink.split("-")[profilLink.split("-").length - 1];
  this.avatarLink = null;

  this.assessmentsCount = null;
  this.averageScore = null;
  this.city = null;
  this.country = null;
  this.followersCount = null;
  this.followingsCount = null;
  this.lastConnectionSince = null;
  this.lastConnectionDate = null;
  this.verifications = [];
  this.description = null;
  this.offers = [];
  this.ratings = [];

  //methodes
}

module.exports = User;
