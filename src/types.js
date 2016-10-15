/* @flow */

export type HttpRequestOptions = {
  protocol: 'http:' | 'https:',
  hostname: string,
  family?: 4 | 6,
  port?: number, // default 80
  method: 'GET' | 'POST',
  path: string, // start with /, includes query string
  headers?: Object,
  auth?: string, // user:password

  Content?: {
    'application/x-www-form-urlencoded'?: Object,
  },
};

export type NodeFetchOptions = {
  method: RequestMethod,
  headers: Object, // request header. format {a:'1'} or {b:['1','2','3']}
  redirect: 'follow' | 'manual' | 'error', // set to `manual` to extract redirect headers, `error` to reject redirect
  follow: number, // maximum redirect count. 0 to not follow redirect
  timeout: number, // req/res timeout in ms, it resets on redirect. 0 to disable (OS limit applies)
  compress: boolean, // support gzip/deflate content encoding. false to disable
  size: 0, // maximum response body size in bytes. 0 to disable
  body: string, // request body. can be a string, buffer, readable stream
  agent: string,
};

export type IPAddress = string;
export type MacAddress = string;


export type FetchParams = string | HttpRequestOptions;

export type ComputerConfigType = {
  mac: MacAddress,
  alias: string,
  appeared: CallbackCollection,
  removed: CallbackCollection,
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
  appeared: CallbackCollection,
  removed: CallbackCollection,
};

export type CallbackName = 'appeared' | 'removed';

export type RequestMethod = 'GET' | 'POST';

export type CallbackCollection = Array<FetchParams>;

export type PingedComputerType = { // ComputerType & {ping: boolean}
  ip: IPAddress,
  mac: MacAddress,
  alias: string,
  appeared: CallbackCollection,
  removed: CallbackCollection,
  ping: boolean,
};
