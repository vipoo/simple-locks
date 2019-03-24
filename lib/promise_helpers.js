async function delay(period) {
  return new Promise(res => setTimeout(res, period))
}

const pausePeriod = 20

async function retry(fn, timeout) {
  let count = timeout / pausePeriod
  let lastError = null
  while (count > 0)
    try {
      return await fn()
    } catch (err) {
      lastError = err
      count--
      await delay(pausePeriod)
    }

  throw lastError
}

async function timeoutPromise(promise, period, message = 'Timed out') {
  let timer
  const tPromise = new Promise((res, rej) => timer = setTimeout(() => rej(new Error(message)), period))

  try {
    return await Promise.race([tPromise, promise])
  } finally {
    clearTimeout(timer)
  }
}

module.exports = {
  delay,
  retry,
  timeoutPromise
}
