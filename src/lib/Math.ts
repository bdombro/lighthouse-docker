/**
 * Extensions for Math
 */

interface Math {
  average(arr: number[]): number
  bound(unbound: number, lower: number, upper: number): number
  standardDeviation(arr: number[], usePopulation?: boolean): number
}

Math.average = (arr) => {
  return arr.reduce((a,v) => a+v, 0) / arr.length
}

/**
 * Bound a number between two other numbers
 * @param unbound - the unbound number input
 * @param lower - the lower bound
 * @param upper - the upper bound
 * @returns 
 */
Math.bound = (unbound, lower, upper) => {
  return Math.max(Math.min(unbound, upper), lower)
}

/**
 * Calc standard deviation
 * 
 * When to use sample or population method
 * 
 * We are normally interested in knowing the population standard deviation because 
 * our population contains all the values we are interested in. Therefore, you 
 * would normally calculate the population standard deviation if: (1) you have the 
 * entire population or (2) you have a sample of a larger population, but you are 
 * only interested in this sample and do not wish to generalize your findings to 
 * the population. However, in statistics, we are usually presented with a sample
 * from which we wish to estimate (generalize to) a population, and the standard
 * deviation is no exception to this. Therefore, if all you have is a sample, but 
 * you wish to make a statement about the population standard deviation from which
 * the sample is drawn, you need to use the sample standard deviation. Confusion 
 * can often arise as to which standard deviation to use due to the name "sample"
 * standard deviation incorrectly being interpreted as meaning the standard 
 * deviation of the sample itself and not the estimate of the population standard 
 * deviation based on the sample. 
 * Src: https://statistics.laerd.com/statistical-guides/measures-of-spread-standard-deviation.php
 * 
 * @param arr 
 * @param usePopulation, use population method of calculating. The sample method is default.
 * @returns standard deviation
 */
Math.standardDeviation = (arr, usePopulation) => {
  const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
  return Math.sqrt(
    arr
      .reduce((acc, val) => acc.concat((val - mean) ** 2), [] as number[])
      .reduce((acc, val) => acc + val, 0)
      / (arr.length - (usePopulation ? 0 : 1))
  );
}
