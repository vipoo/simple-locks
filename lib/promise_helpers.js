async function delay(period) {
  return new Promise(res => setTimeout(res, period))
}

const pausePeriod = 20

async function retry(fn, timeout = 2000) {
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

module.exports = {
  delay,
  retry
}
