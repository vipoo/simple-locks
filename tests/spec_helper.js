const chaiAsPromised = require('chai-as-promised')
const chai = require('chai')
const sinonChai = require('sinon-chai')
const sinon = require('sinon')

chai.use(chaiAsPromised)
chai.use(sinonChai)
module.exports.expect = chai.expect
module.exports.sinon = sinon
