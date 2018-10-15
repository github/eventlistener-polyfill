## EventListener polyfill

This tiny polyfill aims to add the `once` and `passive` event listener options to IE11 and Edge.

For more on those options, read the [mdn documentation on EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)

### Usage

The main file is a UMD wrapper, so if you use requirejs, commonjs, or no module system you can load it in:

#### require.js
```js
define('mymodule', ['eventlistener-polyfill'], function (polyfillEventTarget) {
  // While the polyfill will automatically try to polyfill EventTarget, you may
  // want to polyfill another class
  polyfillEventTarget(MyCustomEventTarget)
})
```

#### commonjs
```js
// Just requiring the file is enough to register the polyfill
require('eventlistener-polyfill')


// While the polyfill will automatically try to polyfill EventTarget, you may
// want to polyfill another class
const polyfillEventTarget = require('eventlistener-polyfill')
polyfillEventTarget(MyCustomEventTarget)
```

#### no module system
```html
<script src="node_modules/eventlistener-polyfill/index.js"></script>
<script>
  // While the polyfill will automatically try to polyfill EventTarget, you may
  // want to polyfill another class
  window.polyfillEventTarget(MyCustomEventTarget)
</script>
```

#### Details

##### Detecting Support

We detect support for `once` and `passive` by making an object with getters for those options. If the browser were to retrieve those values, the getters would trigger and we would know the browser would (in some way) support them. This is working successfully for now - our tests pass in the browsers weve tested, even those where the polyfill is disabled.

##### The once implementation

When passing `once: true` as an option, this polyfill simply wraps your callback in a function which calls `removeEventListener`. You don't need to do anything special here - and `removeEventListener` still works if you call it manually.

##### The passive implementation

`passive: true` is meant to hint to the browser to optimise these EventListeners, at the sacrifice of being unable to run `preventDefault`. In browsers where this works, running `preventDefault` will log an error to the console. This polyfill will not log anything to the console - as it is expected you'll be doing your own cross browser testing and notice this elsewhere. However, just in case, this polyfill does turn `preventDefault` into a noop.
