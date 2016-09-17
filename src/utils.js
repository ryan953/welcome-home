/* @flow */

let INDENT = 0;

module.exports = {
  isInsideListOf(listOf: Array<string>) {
    return function(item: string): boolean {
      return listOf.indexOf(item) >= 0;
    };
  },

  notInsideListOf(listOf: Array<string>) {
    return function(item: string) {
      return listOf.indexOf(item) === -1;
    };
  },

  timePromise(label: string, promise: Promise<*>) {
    var pre = new Array(INDENT).join(' ');
    var counter = 0;

    console.log(pre + 'Starting timer', label, counter++);
    var interval = setInterval(function() {
      console.log(pre + '  Tick', label, counter++);
    }, 1000);

    INDENT += 2;

    return promise.then(function(result) {
      clearInterval(interval);
      INDENT -= 2;
      console.log(pre + 'Done', label, counter++);
      return result;
    });
  },

};
