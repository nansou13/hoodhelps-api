module.exports = function () {
  this.takeNremoveElmtFromArray = function (array) {
    if (array.length === 1) {
      return { index: 0, value: array[0], newArray: [] };
    }

    const rand = Math.random() * array.length;
    const indx = Math.floor(rand);
    return {
      index: indx,
      value: array[indx],
      newArray: array.filter((e) => e !== array[indx]),
    };
  };

  this.create90array = function (length = 90) {
    return Array.from({ length }, (_, i) => i + 1);
  };

  this.makeid = function (length) {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };
};
