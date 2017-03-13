# Editor

## Methods

### Editor.url(url)

 - `url` String

Returns the file path (if it is registered in custom protocol) or url (if it is a known public protocol).

### Editor.loadProfile(name, type, cb)

  - `name` String - The profile name.
  - `type` String - The profile type.
  - `cb` Function - The callback function.

Load profile via `name` and `type`. Once it is loaded, the `cb` will be invoked and returns profile as the first argument.  

### Editor.import(urls)

  - `urls` String|Array - The url list.
