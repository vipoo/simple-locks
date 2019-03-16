const {expect} = require('spec_helper')
const fs = require('fs')
const simpleLocks = require('lib')

function clearLocks() {
  try {
    fs.unlinkSync('/tmp/blah.lock')
  } catch(err) { } // eslint-disable-line
}

describe('Lock acquisition', () => {
  beforeEach(() => clearLocks())

  it('can acquire a new lock', async () => {
    await expect(simpleLocks.acquire('blah')).to.eventually.eq('granted')
  })

  it('can only acquire lock once', async() => {
    await simpleLocks.acquire('blah')
    await expect(simpleLocks.acquire('blah', 10)).to.eventually.be.rejected
  })

  it('will wait until lock is released', async () => {
    await simpleLocks.acquire('blah')
    const lock = simpleLocks.acquire('blah')
    const release = simpleLocks.release('blah')
    await expect(lock).to.eventually.eq('granted')
    await expect(release).to.eventually.eq('released')
  })

  it('will acquire an old stale lock', async () => {
    fs.writeFileSync('/tmp/blah.lock', '')
    const ThirtySecondsAgo = new Date(Date.now() - 2000)
    fs.utimesSync('/tmp/blah.lock', ThirtySecondsAgo, ThirtySecondsAgo)
    await expect(simpleLocks.acquire('blah')).to.eventually.eq('granted')
  })
})
