const debugLog = (message: string) => null // console.debug;

/**
 * Return a promise that resolves after ms milliseconds
 *
 * Is basically the same as Rambdax's delay
 *
 * Can be used in async functions to wait for stuff.
 *
 * For example,
 * while(checkIfTrue()) await sleep(200);
 *
 * @param ms: Number of milliseconds to wait
 *
 **/
export const delay = (ms: number) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms)
  })
}

/**
 * Return a promise that resolves when a callback resolves without throwing, or
 * on give-up (see options). The final promise resolves to the final result of
 * the callback. Will throw an error on give-up by default.
 *
 * For example,
 * const getElement = (selector: string) => document.querySelector(selector) as HTMLDivElement;
 * const element = await waitFor(
 *    () => {
 *        const e = getElement("#treasure")
 *        if (!e) throw new waitFor.NotReadyException()
 *        return e
 *    },
 *    { interval: 50, timeout: 2000 }
 * );
 * element.innerHTML = "Harrrrr!"; // type = HTMLDivElement automagically!
 * element.notAThing = "boo"; // fails type check!
 *
 * @param callback: A function to retry until resolves without a NotReadyException (promises work too)
 * @param options: Options to control when and how to give-up
 * @param options.interval: How often to retry. Will never retry until last is done, though.
 * @param options.timeout: How long to wait before giving up
 * @param options.maxTries: How many times to retry before giving up
 * @param options.throwsErrorOnBail: Whether to throw an error or not on bail (aka give-up)
 *
 */
class NotReadyException extends Error {}
const waitForPass: WaitForPass = async (callback: any, options: any) => {
  const {
    interval = 100,
    timeout = 10000,
    maxTries,
    throwsErrorOnBail = true,
  } = options
  const callbackPromise = async () => callback() // promisify callback
  let tries = 0
  const before = Date.now()
  const getElapsed = () => Date.now() - before
  let res

  while (!res) {
    const timeBeforeCall = getElapsed()

    if (timeBeforeCall > timeout) {
      if (throwsErrorOnBail)
        throw new Error(`waitFor: timed out after ${timeout}ms`)
      else return null as any
    }

    await callbackPromise()
      .then((r) => (res = r))
      .catch((e) => {
        if (!(e instanceof NotReadyException)) throw e
      })
    const timeAfterCall = getElapsed()
    const callDuration = timeAfterCall - timeBeforeCall
    tries++

    if (maxTries && tries > maxTries) {
      if (throwsErrorOnBail)
        throw new Error(`waitFor: reached maxTries at ${tries}`)
      else return null as any
    }

    const timeUntilInterval = interval - callDuration
    debugLog(`waitFor: tries=${tries} timeUntilInt=${timeUntilInterval}`)
    if (timeUntilInterval > 0) {
      debugLog(`waitFor: waiting ${timeUntilInterval}`)
      await delay(timeUntilInterval)
    }
  }
  return res
}
export const waitFor = Object.assign(waitForPass, { NotReadyException })


// Will return a promise of the same type that callback returns. Or you can specify the type
// returned using syntax waitFor<string>(...). UNLESS, you specify throwsErrorOnBail = false;
interface WaitForPass {
  <T extends any>(
    callback: () => T,
    options: {
      interval?: number;
      timeout?: number;
      maxTries?: number;
      throwsErrorOnBail?: true;
    }
  ): Promise<T>;
  <T extends any>(
    callback: () => T,
    options: {
      interval?: number;
      timeout?: number;
      maxTries?: number;
      throwsErrorOnBail: false;
    }
  ): Promise<T | null>;
}

/**
 * Return a promise that resolves when a callback resolves to truthy or on give-up (see options),
 * and that promise resolves to the final result of the callback. Will throw an error on give-up
 * by default.
 *
 * For example,
 * const getElement = (selector: string) => document.querySelector(selector) as HTMLDivElement;
 * const element = await waitForTruthy(
 *    () => getElement("#treasure"),
 *    { interval: 50, timeout: 2000 }
 * );
 * element.innerHTML = "Harrrrr!"; // type = HTMLDivElement automagically!
 * element.notAThing = "boo"; // fails type check!
 *
 * @param callback: A function to retry until truthy (promises work too)
 * @param options: Options to control when and how to give-up
 * @param options.interval: How often to retry. Will never retry until last is done, though.
 * @param options.timeout: How long to wait before giving up
 * @param options.maxTries: How many times to retry before giving up
 * @param options.throwsErrorOnBail: Whether to throw an error or not on bail (aka give-up)
 *
 */
export const waitForTruthy: WaitForTruthy = async (callback: any, options: any = {}) => {
  const { interval = 100, timeout = 60000, maxTries, throwsErrorOnBail = true } = options
  const callbackPromise = async () => callback() // promisify callback
  let tries = 0
  const before = Date.now()
  const getElapsed = () => Date.now() - before
  let res

  while (!res) {
    const timeBeforeCall = getElapsed()

    if (timeBeforeCall > timeout) {
      if (throwsErrorOnBail) throw new Error(`waitFor: timed out after ${timeout}ms`)
      else return null as any
    }

    res = await callbackPromise()
    const timeAfterCall = getElapsed()
    const callDuration = timeAfterCall - timeBeforeCall
    tries++

    if (maxTries && tries > maxTries) {
      if (throwsErrorOnBail) throw new Error(`waitFor: reached maxTries at ${tries}`)
      else return null as any
    }

    const timeUntilInterval = interval - callDuration
    debugLog(`waitFor: tries=${tries} timeUntilInt=${timeUntilInterval}`)
    if (timeUntilInterval > 0) {
      debugLog(`waitFor: waiting ${timeUntilInterval}`)
      await delay(timeUntilInterval)
    }
  }
  return res
}

// Will return a promise of the same type that callback returns. Or you can specify the type
// returned using syntax waitForTruthy<string>(...). UNLESS, you specify throwsErrorOnBail = false;
type WaitForTruthy = {
  <T extends any>(
    callback: () => T,
    options?: { interval?: number; timeout?: number; maxTries?: number; throwsErrorOnBail?: true },
  ): Promise<T>;
  <T extends any>(
    callback: () => T,
    options?: { interval?: number; timeout?: number; maxTries?: number; throwsErrorOnBail: false },
  ): Promise<T | null>;
};


// const testWait = async () => {
//   const before = Date.now();
//   await delay(100);
//   const elapsed = Date.now() - before;
//   if (elapsed < 100) console.log(`testWait.elapsed: Failed`);
//   else console.log(`testWait.elapsed: Passed with ${elapsed}`);
// };
// testWait();

// const testWaitForPass = async () => {
//   let tries = 0
//   let before = Date.now()
//   const getElapsed = () => Date.now() - before
//
//   const callback = async () => {
//     console.log(`Tries: ${tries}; Elapsed: ${getElapsed()}`)
//     await delay(10)
//     if (tries++ < 5) throw 0
//     return "success"
//   }
//
//   tries = 0
//   before = Date.now()
//   await waitForPass(callback, { interval: 0, timeout: 10000 })
//     .then(() => console.log("Success passed"))
//     .catch(() => console.log("Success failed"))
//
//   tries = 0
//   before = Date.now()
//   await waitForPass(callback, { interval: 10, timeout: 10 })
//     .then(() => console.log("Timeout test failed"))
//     .catch(() => console.log("Timeout test passed"))
//
//   tries = 0
//   before = Date.now()
//   await waitForPass(callback, { maxTries: 1 })
//     .then(() => console.log("Max tries test failed"))
//     .catch(() => console.log("Max tries test passed"))
// }
// testWaitForPass()

// const testWaitForTruthy = async () => {
//   let tries = 0;
//   let before = Date.now();
//   const getElapsed = () => Date.now() - before;
//
//   const callback = async () => {
//     console.log(`Tries: ${tries}; Elapsed: ${getElapsed()}`);
//     await delay(10);
//     tries++;
//     return tries > 5;
//   };
//
//   tries = 0;
//   before = Date.now();
//   await waitForTruthy(callback, { interval: 0, timeout: 10000 })
//     .then(() => console.log("Success passed"))
//     .catch(() => console.log("Success failed"));
//
//   tries = 0;
//   before = Date.now();
//   await waitForTruthy(callback, { interval: 10, timeout: 10 })
//     .then(() => console.log("Timeout test failed"))
//     .catch(() => console.log("Timeout test passed"));
//
//   tries = 0;
//   before = Date.now();
//   await waitForTruthy(callback, { maxTries: 1 })
//     .then(() => console.log("Max tries test failed"))
//     .catch(() => console.log("Max tries test passed"));
// };
// testWaitForTruthy();