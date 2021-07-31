function User(profilLink) {
  this.profilLink = profilLink;
  this.nickName = profilLink.split("-")[profilLink.split("-").length - 1];
  this.avatarLink = null;
  this.setAvatarLink = (avatarLink) => {
    this.avatarLink = avatarLink;
  };
  this.grade = 0;
  this.setGrade = (grade) => {
    this.grade = grade;
  };
  this.ratings = 0;
  this.setRatings = (ratings) => {
    this.ratings = ratings;
  };
  this.aboutInformations = [];
  this.setAboutInformations = (aboutInformations) => {
    this.aboutInformations = aboutInformations;
  };
}

module.exports = User;
