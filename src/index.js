#!/usr/bin/env node

function start() {
  try {
    var WH = require('./WH');

    WH.queueAddressLookup(0);

    process.on('SIGTERM', () => {
      WH.stopListening();
      process.exit(0);
    });
  } catch (e) {
    console.log('error in stack', e);
    setTimeout(function() {
      console.log('done waiting');
    }, 50 * 1000);
  }
}

start();
