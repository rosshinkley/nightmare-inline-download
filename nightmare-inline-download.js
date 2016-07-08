var sliced = require('sliced'),
  debug = require('debug')('nightmare:download');

module.exports = exports = function(Nightmare) {
  Nightmare.action('download',
    function(ns, options, parent, win, renderer, done) {
      var fs = require('fs'),
        join = require('path')
        .join,
        sliced = require('sliced');

      var app = require('electron').app;

      var _parentRequestedDownload = false,
        _maxParentRequestWait = options.maxDownloadRequestWait || 5000;
      parent.on('expect-download', function() {
        _parentRequestedDownload = true;
      });

      win.webContents.session.on('will-download',
        function(event, downloadItem, webContents) {
          //pause the download and set the save path to prevent dialog
          downloadItem.pause();
          downloadItem.setSavePath(join(app.getPath('downloads'), downloadItem.getFilename()));

          var downloadInfo = {
            filename: downloadItem.getFilename(),
            mimetype: downloadItem.getMimeType(),
            receivedBytes: 0,
            totalBytes: downloadItem.getTotalBytes(),
            url: downloadItem.getURL(),
            path: join(app.getPath('downloads'), downloadItem.getFilename())
          };

          var elapsed = 0;
          var wait = function() {
            if (_parentRequestedDownload) {
              parent.emit('log', 'will-download');
              if (options.ignoreDownloads) {
                parent.emit('log', 'ignoring all downloads');
                parent.emit('download', 'cancelled', downloadInfo);
                downloadItem.cancel();
                return;
              }
              downloadItem.on('done', function(e, state) {
                if (state == 'completed') {
                  fs.renameSync(join(app.getPath('downloads'), downloadItem.getFilename()), downloadInfo.path);
                }
                _parentRequestedDownload = false;
                parent.emit('download', state, downloadInfo);
              });

              downloadItem.on('updated', function(event) {
                downloadInfo.receivedBytes = event.sender.getReceivedBytes();
                parent.emit('download', 'updated', downloadInfo);
              });

              downloadItem.setSavePath(downloadInfo.path);

              var handler = function() {
                var arguments = sliced(arguments)
                  .filter(function(arg) {
                    return !!arg;
                  });
                var item, path;
                if (arguments.length == 1 && arguments[0] === Object(arguments[0])) {
                  item = arguments[0];
                } else if (arguments.length == 2) {
                  path = arguments[0];
                  item = arguments[1];
                }

                if (item.filename == downloadItem.getFilename()) {
                  if (path == 'cancel') {
                    downloadItem.cancel();
                  } else {
                    if (path && path !== 'continue') {
                      //.setSavePath() does not overwrite the first .setSavePath() call
                      //use `fs.rename` when download is completed
                      downloadInfo.path = path;
                    }
                    downloadItem.resume();
                  }
                }
              };

              parent.once('download', handler);
              parent.emit('log', 'will-download about bubble to parent');
              parent.emit('download', 'started', downloadInfo);
            } else if (elapsed >= _maxParentRequestWait) {
              parent.emit('download', 'force-cancelled', downloadInfo);
              parent.emit('log', 'no parent request received for download, discarding');
              return downloadItem.cancel();
            } else {
              parent.emit('log', 'waiting, elapsed: ' + elapsed);
              elapsed += 100;
              setTimeout(wait, 100);
            }
          }
          wait();
        });
      done();
    },
    function() {
      var self = this,
        path, done;
      if (arguments.length == 2) {
        path = arguments[0];
        done = arguments[1];
      } else {
        done = arguments[0];
      }
      
      var handler = function(state, downloadInfo) {
        downloadInfo.state = state;
        debug('download', downloadInfo);
        if (state == 'started') {
          if (self.options.ignoreDownloads) {
            self.child.emit('download', 'cancel', downloadInfo);
          } else {
            self.child.emit('download', path || 'continue', downloadInfo);
          }
        } else {
          if (state == 'interrupted' || state == 'force-cancelled') {
            self.child.removeListener('download', handler);
            done(state, downloadInfo);
          } else if (state == 'completed' || state == 'cancelled') {
            self.child.removeListener('download', handler);
            done(null, downloadInfo);
          }
        }
      };
      self.child.on('download', handler);

      self.child.emit('expect-download');
      return this;
    });
};
