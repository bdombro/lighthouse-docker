const debugMode = process.env.DEBUG
export default {
  info: console.info,
  debug: debugMode ? console.debug : (...p: any) => null,
  error: console.error,
}