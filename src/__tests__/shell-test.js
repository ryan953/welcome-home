const shell = require('../shell');

describe('shell', () => {

  it('pingIPAddress succeeds', () => {
    return shell.pingIPAddress('127.0.0.1')
      .then((result) => {
        expect(result).toBe(true);
      });
  });

  it('pingIPAddress fails when weird ip passed', () => {
    return shell.pingIPAddress('127.0.0.11')
      .then((result) => {
        expect(result).toBe(false);
      });
  });

  it('pingIPAddress fails when undefined passed', () => {
    return shell.pingIPAddress()
      .then((result) => {
        expect(result).toBe(false);
      });
  });

});
