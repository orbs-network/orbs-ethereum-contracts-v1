// import fetch from 'node-fetch';
import { retry } from 'ts-retry-promise';
import _ from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorString(e: any) {
  return (e && e.stack) || '' + e;
}

export function toNumber(val: number | string) {
  if (typeof val == 'string') {
    return parseInt(val);
  } else return val;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// returns UTC clock time in seconds (similar to unix timestamp / Ethereum block time / RefTime)
export function getCurrentClockTime() {
  return Math.round(new Date().getTime() / 1000);
}

export function isStaleTime(referenceTimeSeconds: number | string, differenceSeconds: number): boolean {
  const currentTime = getCurrentClockTime();
  if (_.isString(referenceTimeSeconds)) {
    referenceTimeSeconds = Math.round(new Date(referenceTimeSeconds).valueOf() / 1000);
  }
  // @ts-ignore
  return currentTime > referenceTimeSeconds + differenceSeconds;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonResponse = any;

// TODO : FUTURE : O.L : Move this to http service
export async function fetchJson(url: string) {
  return await retry(
    async () => {
      const response = await fetch(url);

      // console.log({ response });
      const body = await response.text();
      // console.log('body', body);
      try {
        return JSON.parse(body);
      } catch (e) {
        throw new Error(`Invalid response for url '${url}': ${body}`);
      }
    },
    { retries: 3, delay: 300 },
  );
}
