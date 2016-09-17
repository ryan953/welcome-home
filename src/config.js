/* @flow */

import type {
  MacAddress,
  ConfigType,
  ComputerConfigType,
} from './types';

module.exports = {
  get() {
    const config = require('../config.json');

    return ({
      frequency: config.frequency,

      macs: config.hosts.map((host) => host.mac),

      forMac(macAddress: MacAddress): ComputerConfigType {
        return config.hosts
          .filter((host) => host.mac == macAddress)
          .pop() || {mac: macAddress, alias: '', appeared: [], removed: []};
      },

    });
  }
};
