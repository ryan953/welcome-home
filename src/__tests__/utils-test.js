const utils = require('../utils');

describe('utils', () => {
  it('isInsideListOf', () => {
    const numbers = [1, 2, 3];
    expect(utils.isInsideListOf(numbers)(2)).toEqual(true);
    expect(utils.isInsideListOf(numbers)(4)).toEqual(false);
  });

  it('notInsideListOf', () => {
    const numbers = [1, 2, 3];
    expect(utils.notInsideListOf(numbers)(6)).toEqual(true);
    expect(utils.notInsideListOf(numbers)(1)).toEqual(false);
  });

});
