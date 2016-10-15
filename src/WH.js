/* @flow */

import type {
  CallbackCollection,
  CallbackName,
  ComputerConfigType,
  ComputerType,
  ConfigType,
  FetchParams,
  NICType,
  PingedComputerType,
  RequestMethod,
} from './types';

const fs = require('fs');
const http = require('http');
const https = require('https');
const querystring = require('querystring');
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
      throw e;
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

    const pingedComputers = computers
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
      return pingedComputers;
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

  makeCallback(callbackName: CallbackName) {
    return (computer: PingedComputerType) => {
      console.log(new Date(), `${computer.alias} ${computer.mac} ${callbackName}`);
      computer[callbackName].forEach(
        (fetchParams) => this.fetchEndpoint(fetchParams)
      );
    };
  },

  fetchEndpoint(fetchParams: FetchParams) {
    if (typeof fetchParams == 'string') {
      console.log('  Calling', 'GET', new Date(), fetchParams);
      http.get(fetchParams, (response) => {
        console.log('  Got Response', response.statusCode);
      });
    } else {
      const {Content, ...options} = fetchParams;

      let data = null;
      if (Content && Content['application/x-www-form-urlencoded']) {
        data = querystring.stringify(
          Content['application/x-www-form-urlencoded']
        );

        options.headers = {
          ...options.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(data)
        };
      }

      options.headers = {
        ...options.headers,
        'User-Agent': 'ryan953/welcome-home v1.0',
      };

      const httpModule = options.protocol == 'https:' ? https : http;

      console.log('  Calling', options.method, new Date(), options.hostname, options);
      const req = httpModule.request(options, (response) => {
        console.log('Got response:', response.statusCode);
        // consume response body
        response.resume();
      });
      req.on('error', (error) => {
        console.log('request error', error);
      });
      if (data) {
        req.write(data);
      }
      req.end();
    }
  },

};

module.exports = WH;
