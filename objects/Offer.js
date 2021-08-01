function Offer(link) {
  this.link = link;
  this.pictures = [];
  this.basePriceEuros = null;
  this.shippingPrices = null;
  this.descriptors = [];
  this.title = null;
  this.description = null;
  this.comments = [];
}

module.exports = Offer;
