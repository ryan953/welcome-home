#!/usr/bin/env node

var WH = require('./WH');

WH.queueAddressLookup(0);

process.on('SIGTERM', () => {
  WH.stopListening();
  process.exit(0);
});
