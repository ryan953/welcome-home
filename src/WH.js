/* @flow */

import type {
  CallbackNames,
  ComputerConfigType,
  ComputerType,
  ConfigType,
  NICType,
  PingedComputerType,
} from './types';

const fetch = require('node-fetch');
const fs = require('fs');
const shell = require('./shell');
const utils = require('./utils');

const DEFAULT_FREQUENCY = 30 * 1000;

let LAST_KNOWN_COMPUTERS: Array<ComputerType> = [];

let _timeout: ?number = null;

const WH = {
  nicsToComputers(nics: Array<NICType>): Array<ComputerType> {
    let config;
    try {
      config = require('./config').get();
    } catch (e) {
      console.log('config failed', e);
    }
    // console.log('found config', config);
    const isImportantMacAddresss = utils.isInsideListOf(config.macs);
    return nics
      .filter((nic: NICType): boolean => isImportantMacAddresss(nic.mac))
      .map((nic: NICType): ComputerType => {
        const computerConfig = config.forMac(nic.mac)
        return {
          ip: nic.ip,
          mac: nic.mac,
          alias: computerConfig.alias,
          appeared: computerConfig.appeared,
          removed: computerConfig.removed,
        };
      });
  },

  concatPreviousComputers(computers: Array<ComputerType>): Array<ComputerType> {
    const newMacs = computers.map((computer) => computer.mac);
    const old = LAST_KNOWN_COMPUTERS.filter((old: ComputerType) => !newMacs.includes(old.mac));

    return computers.concat(old);
  },

  pingComputers(computers: Array<ComputerType>): Promise<Array<PingedComputerType>> {
    const promises = [];

    const objects = computers
      .map((computer: ComputerType): PingedComputerType => {
        return {
          ip: computer.ip,
          mac: computer.mac,
          alias: computer.alias,
          appeared: computer.appeared,
          removed: computer.removed,
          ping: false
        };
      })
      .map((computer: PingedComputerType) => {
        promises.push(
          shell.pingIPAddress(computer.ip || null)
            .then((ping) => computer.ping = ping)
      );
      return computer;
    });

    return Promise.all(promises).then((pings): Array<PingedComputerType> => {
      return objects;
    });
  },

  run() {
    shell.getARPNics()
      .then((nics: Array<NICType>): Promise<Array<PingedComputerType>> =>
        WH.pingComputers(
          WH.concatPreviousComputers(
            WH.nicsToComputers(nics)
          )
        )
      )
      .then((computers: Array<PingedComputerType>) => {
        // console.log('Pinged Computers', computers);

        const oldMacs = LAST_KNOWN_COMPUTERS.map((computer) => computer.mac);

        const born = computers
          .filter((computer: PingedComputerType): boolean => computer.ping)
          .filter((computer: PingedComputerType): boolean => !oldMacs.includes(computer.mac));

        const died = computers
          .filter((computer: PingedComputerType): boolean => !computer.ping)
          .filter((computer: PingedComputerType): boolean => oldMacs.includes(computer.mac));

        console.log('Born', born);
        console.log('Died', died);

        born.forEach(WH.makeCallback('appeared'));
        died.forEach(WH.makeCallback('removed'));

        LAST_KNOWN_COMPUTERS = computers
          .filter((computer) => computer.ping)
          .map((computer) => {
            return {
              ip: computer.ip,
              mac: computer.mac,
              alias: computer.alias,
              appeared: computer.appeared,
              removed: computer.removed,
              // removed `ping`
            };
          });
      })
      .then(() => {
        // console.log('DONE');
        // console.log('');
        const config = require('./config').get();
        WH.queueAddressLookup(config.frequency);
      })
      .catch((error) => {
        console.log('Error!', error);
        // console.log('');
        const config = require('./config').get();
        WH.queueAddressLookup(config.frequency);
      });

  },

  queueAddressLookup(interval) {
    interval = interval == null ? DEFAULT_FREQUENCY : interval;

    _timeout = setTimeout(WH.run, interval);
  },

  stopListening() {
    _timeout && clearTimeout(_timeout);
  },

  makeCallback(callbackName: CallbackNames) {
    return (computer: PingedComputerType) => {
      console.log(new Date(), `${computer.alias} ${computer.mac} ${callbackName}`);
      computer[callbackName].forEach((url) => {
        const uri = require('util').format(url, encodeURIComponent(computer.alias));
        console.log('  Calling', uri);
        fetch(uri, {
          headers: {
            'User-Agent': 'welcome-home v1.0',
          },
        })
          .then((result) => {
            return result.text();
          })
          .then((text) => {
            console.log('got', text);
          })
          .catch((err) => {
            console.log('error', err);
          });
      });
    };

  },

};

module.exports = WH;
