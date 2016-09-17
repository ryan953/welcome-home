/* @flow */

import type {
  CallbackNames,
  ComputerConfigType,
  ComputerType,
  ConfigType,
  NICType,
  PingedComputerType,
} from './types';

const fs = require('fs');
const utils = require('./utils');
const shell = require('./shell');

const DEFAULT_FREQUENCY = 30 * 1000;

let LAST_KNOWN_COMPUTERS: Array<ComputerType> = [];

const WH = {

  nicsToComputers(nics: Array<NICType>): Array<ComputerType> {
    const config = require('./config').get();
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
        console.log('DONE');
        console.log('');
        const config = require('./config').get();
        WH.queueAddressLookup(config.frequency);
      })
      .catch((error) => {
        console.log('error!', error);
        console.log('');
        const config = require('./config').get();
        WH.queueAddressLookup(config.frequency);
      });

  },

  queueAddressLookup(interval) {
    interval = interval == null ? DEFAULT_FREQUENCY : interval;

    setTimeout(WH.run, interval);
  },

  makeCallback(callbackName: CallbackNames) {
    return (computer: PingedComputerType) => {
      console.log('Computer', computer.alias, computer.mac, 'was', callbackName);
      computer[callbackName].forEach((url) => {
        console.log('  Calling', url);
      });
    };

  },

};

module.exports = WH;
