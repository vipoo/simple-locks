const path = require('path')
const fs = require('fs')
const {promisify} = require('util')
const {retry} = require('./promise_helpers')

const {O_TRUNC, O_CREAT, O_WRONLY, O_EXCL} = require('constants')
const fileOptions = O_TRUNC | O_CREAT | O_WRONLY | O_EXCL
const fsOpen = promisify(fs.open)
const fsUnlink = promisify(fs.unlink)
const fsStat = promisify(fs.stat)
const fsClose = promisify(fs.close)
const lettersOnly = /^[a-zA-Z]+$/

const LockStalePeriod = 2000 // Period of time when a lock is auto released in milliseconds

function safeNameOnly(name) {
  if (!lettersOnly.test(name))
    throw new Error('Lock name can only be lettes')

  return `${path.join('/tmp', name)}.lock`
}

async function acquire(name, timeout = 2000) {
  const p = safeNameOnly(name)

  const fd = await retry(async () => {
    return await fsOpen(p, fileOptions).catch(async err => {
      if (err.code !== 'EEXIST')
        throw err

      const {mtime} = await fsStat(p)
      const diff = Date.now() - mtime.getTime()
      if (diff < LockStalePeriod)
        throw new Error('lock file not stale')

      await fsUnlink(p)
      throw new Error('retry')
    })
  }, timeout)

  await fsClose(fd)
  return 'granted'
}

async function release(name) {
  const p = safeNameOnly(name)
  await fsUnlink(p)
  return 'released'
}

module.exports = {
  acquire,
  release
}
