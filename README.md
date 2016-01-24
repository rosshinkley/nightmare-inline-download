nightmare-inline-download
======================

Add inline download management to your [Nightmare](http://github.com/segmentio/nightmare) scripts.

# Important Note
This library will not be ready for use until [Nightmare #391](https://github.com/segmentio/nightmare/issues/391) is completed.  For now, if this library is needed, use the [`electron-plugin` branch from my fork](https://github.com/rosshinkley/nightmare/tree/electron-plugin).

# Another Important Note
If you need to manage multiple downloads at the same time or want downloads to be processed in the background, check out the [Nightmare download manager](https://github.com/rosshinkley/nightmare-download-manager).

## Usage
Require the library: 

```js
require('nightmare-inline-download')
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
require('nightmare-inline-download');
var nightmare = Nightmare();
var downloadInfo = yield nightmare
  .goto('https://github.com/segmentio/nightmare')
  .click('a[href="/segmentio/nightmare/archive/master.zip"]')
  .download('/some/other/path/master.zip');

// ... do something with downloadInfo ...

yield nightmare.end();
```
