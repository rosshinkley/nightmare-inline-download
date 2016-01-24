/**
 * Module dependencies.
 */

require('mocha-generators')
  .install();

var Nightmare = require('nightmare');
var should = require('chai')
  .should();
var url = require('url');
var server = require('./server');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var rimraf = require('rimraf');

/**
 * Temporary directory
 */

var tmp_dir = path.join(__dirname, 'tmp')

/**
 * Get rid of a warning.
 */

process.setMaxListeners(0);

/**
 * Locals.
 */

var base = 'http://localhost:7500/';

describe('Nightmare download manager', function() {
  before(function(done) {
    require('../nightmare-inline-download');
    server.listen(7500, done);
  });

  it('should be constructable', function * () {
    var nightmare = Nightmare();
    nightmare.should.be.ok;
    nightmare.download.should.be.ok;
    yield nightmare.end();
  });

  describe('downloads', function() {
    var nightmare;

    before(function(done) {
      mkdirp(path.join(tmp_dir, 'subdir'), done);
    })

    after(function(done) {
      rimraf(tmp_dir, done)
    })

    afterEach(function * () {
      yield nightmare.end();
    });

    it('should download a file', function * () {
      var downloadItem, statFail = false;

      nightmare = Nightmare({
        paths: {
          'downloads': tmp_dir
        },
      });

      var downloadItem = yield nightmare
        .goto(fixture('downloads'))
        .click('#dl1')
        .download();

      try {
        fs.statSync(path.join(tmp_dir, '100kib.txt'));
      } catch (e) {
        statFail = true;
      }

      downloadItem.should.be.ok;
      downloadItem.filename.should.equal('100kib.txt');
      downloadItem.state.should.equal('completed');
      statFail.should.be.false;
    });

    it('should error when download time exceeds request timeout', function * () {
      var didForceCancel = false;

      nightmare = Nightmare({
        paths: {
          'downloads': tmp_dir
        },
        waitTimeout: 30000,
        maxDownloadRequestWait: 100
      });

      nightmare.on('download', function(state, downloadInfo) {
        if (state == 'force-cancelled') {
          didForceCancel = true;
        }
      })
      yield nightmare
        .goto(fixture('downloads'))
        .click('#dl2')

      yield nightmare.wait(1000);

      didForceCancel.should.be.true;
    });

    it('should set a path for a specific download', function * () {
      var downloadItem, statFail = false,
        finalState;

      nightmare = Nightmare({
        paths:{
          downloads: tmp_dir
        }
      });

      var downloadItem = yield nightmare
        .goto(fixture('downloads'))
        .click('#dl1')
        .download(path.join(tmp_dir, 'subdir', '100kib.txt'));

      try {
        fs.statSync(path.join(tmp_dir, 'subdir', '100kib.txt'));
      } catch (e) {
        statFail = true;
      }

      downloadItem.should.be.ok;
      downloadItem.state.should.equal('completed');
      statFail.should.be.false;
    });

    it('should cancel a specific download', function * () {
      var downloadItem, finalState;

      nightmare = Nightmare({
        paths: {
          downloads: tmp_dir
        }
      });
      
      var downloadItem = yield nightmare
        .goto(fixture('downloads'))
        .click('#dl1')
        .download('cancel');

      downloadItem.should.be.ok;
      downloadItem.state.should.equal('cancelled');
    });
    
    it('should ignore all downloads', function * () {
      nightmare = Nightmare({
        paths: {
          'downloads': tmp_dir
        },
        ignoreDownloads: true
      });

      var downloadItem = yield nightmare
        .goto(fixture('downloads'))
        .click('#dl1')
        .download();
      
      downloadItem.should.be.ok;
      downloadItem.state.should.equal('cancelled');
    });
  });
});

/**
 * Generate a URL to a specific fixture.
 * @param {String} path
 * @returns {String}
 */

function fixture(path) {
  return url.resolve(base, path);
}
