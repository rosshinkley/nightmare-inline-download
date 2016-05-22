nightmare-inline-download
======================

Add inline download management to your [Nightmare](http://github.com/segmentio/nightmare) scripts.

# Important Note
If you need to manage multiple downloads at the same time or want downloads to be processed in the background, check out the [Nightmare download manager](https://github.com/rosshinkley/nightmare-download-manager).

## Usage
Require the library: and pass the Nightmare library as a reference to attach the plugin actions:

```js
var Nightmare = require('nightmare');
require('nightmare-inline-download')(Nightmare);
```

... and that's it.  You should now be able to handle downloads.

### .download([path|action])

Allows for downloads to be saved to a custom location or cancelled.  The possible values for `action` are `'cancel'`, `'continue'` for default behavior, or a file path (file name and extension inclusive) to save the download to an alternative location.  If yielded upon, `.download()` returns a hash of download information:

* **filename**:  the filename the server sent.
* **mimetype**: the mimetype of the download.
* **receivedBytes**: the number of bytes received for a download.
* **totalBytes**: the number of bytes to expect if `Content-length` is set as a header.
* **url**: the address of where the download is being sent from.
* **path**: specifies the save path for the download.
* **state**: the state of the download.  At yield, `state` can be `'cancelled'`, `'interrupted'`, or `'completed'`.

## Additional Nightmare Options

### ignoreDownloads
Defines whether or not all downloads should be ignored.

### maxDownloadRequestWait
Sets the maximum time for the client to anticipate a `.download()` call.  If the call is not made, the download is automatically cancelled.

### paths.downloads
Sets the Electron path for where downloads are saved.

## Example

```javascript
var Nightmare = require('nightmare');
require('nightmare-inline-download')(Nightmare);
var nightmare = Nightmare();
var downloadInfo = nightmare
  .goto('https://github.com/segmentio/nightmare')
  .click('a[href="/segmentio/nightmare/archive/master.zip"]')
  .download('/some/other/path/master.zip');

// ... do something with downloadInfo, in an evaluate for example ...

  .end()
  .then(()=>console.log('done'));
```
