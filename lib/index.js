const path = require('path')
const fs = require('fs')
const {promisify} = require('util')
const {retry, timeoutPromise} = require('./promise_helpers')

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

function getArgs(args) {
  let fn = args[0]
  let timeout = args[1] || 2000
  if (args.length === 1)
    if (typeof (args[0]) === 'function')
      fn = args[0]
    else
      timeout = args[0] || 2000

  return {fn, timeout}
}

async function acquire(name, ...args) {
  const {fn, timeout} = getArgs(args)
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

  if (fn)
    try {
      await timeoutPromise(fn(), timeout, 'Block function took longer than allowed')
    } finally {
      release(name)
    }

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
