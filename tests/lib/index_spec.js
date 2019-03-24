const {expect, sinon} = require('spec_helper')
const fs = require('fs')
const simpleLocks = require('lib')
const {delay} = require('lib/promise_helpers')

function clearLocks() {
  try {
    fs.unlinkSync('/tmp/blah.lock')
  } catch(err) { } // eslint-disable-line
}

describe('Lock blocks', () => {
  beforeEach(() => clearLocks())

  it('can acquire a new lock', async () => {
    const cb = sinon.stub()
    await simpleLocks.acquire('blah', cb)

    expect(cb).to.have.been.called
  })

  it('can only acquire lock once', async () => {
    const firstCb = sinon.stub()
    const secondCb = sinon.stub()

    const p1 = simpleLocks.acquire('blah', firstCb)
    const p2 = simpleLocks.acquire('blah', secondCb, 10)

    await expect(p2).to.eventually.be.rejected
    await expect(p1).to.eventually.eq('granted')
    expect(firstCb).to.have.been.called
    expect(secondCb).to.not.have.been.called
  })

  it('will wait until lock is released', async () => {
    const firstCb = sinon.stub()
    const secondCb = sinon.stub()

    const p1 = simpleLocks.acquire('blah', firstCb)
    const p2 = simpleLocks.acquire('blah', secondCb)

    await Promise.all([p1, p2])

    await expect(p1).to.eventually.eq('granted')
    await expect(p2).to.eventually.eq('granted')
    expect(firstCb).to.have.been.called
    expect(secondCb).to.have.been.called
  })

  it('will acquire an old stale lock', async () => {
    fs.writeFileSync('/tmp/blah.lock', '')
    const ThirtySecondsAgo = new Date(Date.now() - 2000)
    fs.utimesSync('/tmp/blah.lock', ThirtySecondsAgo, ThirtySecondsAgo)

    const cb = sinon.stub()
    await simpleLocks.acquire('blah', cb)

    expect(cb).to.have.been.called
  })

  it('will reject if lock not released in time', async () => {
    fs.writeFileSync('/tmp/blah.lock', '')
    const ThirtySecondsAgo = new Date(Date.now())
    fs.utimesSync('/tmp/blah.lock', ThirtySecondsAgo, ThirtySecondsAgo)

    const cb = sinon.stub()
    const p1 = simpleLocks.acquire('blah', cb, 10)

    await expect(p1).to.eventually.be.rejected
    expect(cb).to.not.have.been.called
  })

  it('will reject if block takes longer than request timeout', async () => {
    const p1 = simpleLocks.acquire('blah', () => delay(100), 10)

    await expect(p1).to.eventually.be.rejectedWith('Block function took longer than allowed')
  })
})

describe('Lock acquisition', () => {
  beforeEach(() => clearLocks())

  it('can acquire a new lock', async () => {
    await expect(simpleLocks.acquire('blah')).to.eventually.eq('granted')
  })

  it('can only acquire lock once', async () => {
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
