function User(profilLink, offer, offers) {
  this.profilLink = profilLink;
  this.offers = [];
  if (offers) {
    this.offers = [...offers];
  }
  if (offer) {
    this.offers.push(offer);
  }
}

module.exports = User;
