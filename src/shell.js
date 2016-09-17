/* @flow */

import type {IPAddress, NICType} from './types';

var exec = require('child_process').exec;

var MAC_ADDRESS_REGEX = /(([A-Fa-f0-9]{1,2}[:]){5}[A-Fa-f0-9]{1,2}[,]?)+/;
var IP_ADDRESS_REGEX = /((?:(?:\d){1,3}?\.){3}(\d){1,3})/;

function promiseExec(command: string, args: Array<string | number>): Promise<*> {
  var promise = new Promise(function(resolve, reject) {
    exec(command + ' ' + (args || []).join(' '), function(error, stdout, stderr) {
      if (error) {
        reject({error: error});
      } else {
        resolve({
          stdout: stdout,
          stderr: stderr
        });
      }
    });
  }).catch(function(error) {
    // console.log('PromiseExec failed', command, error);
    throw error;
  });

  // return DEBUG ? WH.timePromise('Exec: ' + command, promise) : promise;
  return promise;
}

module.exports = {
  getARPNics(): Promise<Array<NICType>> {
    return promiseExec('arp', ['-a'])
      .then(function(out) {
        return out.stdout.split("\n")
          .map((line): NICType => ({
            ip: (line.match(IP_ADDRESS_REGEX) || [])[0],
            mac: (line.match(MAC_ADDRESS_REGEX) || [])[0],
          }))
          .filter(function(computer) {
            return !!computer.mac;
          });
      })
      .catch((error) => {
        return [];
      });
  },

  pingIPAddress(ipAddress: ?IPAddress): Promise<boolean> {
    if (!ipAddress) {
      return Promise.resolve(false);
    }
    return promiseExec('ping', ['-n', '-o', '-q', '-t', 1, ipAddress])
      .then(function(out) {
        return out.stdout.includes('1 packets transmitted, 1 packets received, 0.0% packet loss');
      })
      .catch((error) => {
        return false;
      });
  },

};
