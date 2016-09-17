
var WH = require('../WH');

var TEST_MAC_ADDRESS = "aa:bb:cc:dd:ee:ff";
var CONFIG = {
  hosts: [
    {
      "mac": TEST_MAC_ADDRESS,
      "alias": "Test Device",
      "appeared": [
        "example.com/added"
      ],
      "removed": [
        "example.com/removed"
      ]
    }
  ],
};

describe('WH', () => {
  it('pingIPAddress succeeds', () => {
    return WH.pingIPAddress('127.0.0.1')
      .then((result) => {
        expect(result).toBe(true);
      });
  });

  it('pingIPAddress fails', () => {
    return WH.pingIPAddress('127.0.0.11')
      .then((result) => {
        expect(result).toBe(false);
      });
  });

  describe('getConfigForMacAddress', () => {
    it('should return some config info for a mac', () => {
      expect(
        WH.getConfigForMacAddress(CONFIG)(TEST_MAC_ADDRESS)
      ).toEqual({
        mac: TEST_MAC_ADDRESS,
        alias: 'Test Device',
        appeared: ['example.com/added'],
        removed: ['example.com/removed'],
      });
    });
  });
});
