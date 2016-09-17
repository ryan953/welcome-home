/* @flow */

export type IPAddress = string;
export type MacAddress = string;
export type URL = string;

export type ComputerConfigType = {
  mac: MacAddress,
  alias: string,
  appeared: Array<URL>,
  removed: Array<URL>,
};

export type ConfigType = {
  broadcast: string,
  frequency: number,
  hosts: Array<ComputerConfigType>,
};


export type NICType = {
  ip: IPAddress,
  mac: MacAddress,
};

export type ComputerType = { // NICType & ComputerConfigType
  ip: IPAddress,
  mac: MacAddress,
  alias: string,
  appeared: Array<URL>,
  removed: Array<URL>,
};

export type CallbackNames = 'appeared' | 'removed';

export type PingedComputerType = { // ComputerType & {ping: boolean}
  ip: IPAddress,
  mac: MacAddress,
  alias: string,
  appeared: Array<URL>,
  removed: Array<URL>,
  ping: boolean,
};
