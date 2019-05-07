var passiveSupported = false
var onceSupported = false
function noop() {}
try {
  var options = Object.create({}, {
    passive: {get: function() { passiveSupported = true }},
    once: {get: function() { onceSupported = true }},
  })
  window.addEventListener('test', noop, options)
  window.removeEventListener('test', noop, options)
} catch (e) { /* */ }

var enhance = module.exports = function enhance(proto) {
  var originalAddEventListener = proto.addEventListener
  var originalRemoveEventListener = proto.removeEventListener

  var listeners = new WeakMap()
  proto.addEventListener = function(name, originalCallback, optionsOrCapture) {
    if (
      optionsOrCapture === undefined ||
      optionsOrCapture === true ||
      optionsOrCapture === false ||
      (!originalCallback || typeof originalCallback !== 'function' && typeof originalCallback !== 'object')
    ) {
      return originalAddEventListener.call(this, name, originalCallback, optionsOrCapture)
    }

    var callback = typeof originalCallback !== 'function' && typeof originalCallback.handleEvent === 'function' ? originalCallback.handleEvent.bind(originalCallback) : originalCallback
    var options = typeof optionsOrCapture === 'boolean' ? {capture: optionsOrCapture} : optionsOrCapture || {}
    var passive = Boolean(options.passive)
    var once = Boolean(options.once)
    var capture = Boolean(options.capture)
    var oldCallback = callback

    if (!onceSupported && once) {
      callback = function(event) {
        this.removeEventListener(name, originalCallback, options)
        oldCallback.call(this, event)
      }
    }

    if (!passiveSupported && passive) {
      callback = function(event) {
        event.preventDefault = noop
        oldCallback.call(this, event)
      }
    }

    if (!listeners.has(this)) listeners.set(this, new WeakMap())
    var elementMap = listeners.get(this)
    if (!elementMap.has(originalCallback)) elementMap.set(originalCallback, [])
    var optionsOctal = (passive * 1) + (once * 2) + (capture * 4)
    elementMap.get(originalCallback)[optionsOctal] = callback

    originalAddEventListener.call(this, name, callback, capture)
  }

  proto.removeEventListener = function(name, originalCallback, optionsOrCapture) {
    var capture = Boolean(typeof optionsOrCapture === 'object' ? optionsOrCapture.capture : optionsOrCapture)

    var elementMap = listeners.get(this)
    if (!elementMap) return originalRemoveEventListener.call(this, name, originalCallback, optionsOrCapture)
    var callbacks = elementMap.get(originalCallback)
    if (!callbacks) return originalRemoveEventListener.call(this, name, originalCallback, optionsOrCapture)

    for (var optionsOctal in callbacks) {
      var callbackIsCapture = Boolean(optionsOctal & 4)
      if (callbackIsCapture !== capture) continue // when unbinding, capture is the only option that counts
      originalRemoveEventListener.call(this, name, callbacks[optionsOctal], callbackIsCapture)
    }

  }

}

if (!passiveSupported || !onceSupported) {

  if (typeof EventTarget !== 'undefined') {
    enhance(EventTarget.prototype)
  } else {
    enhance(Text.prototype)
    enhance(HTMLElement.prototype)
    enhance(HTMLDocument.prototype)
    enhance(Window.prototype)
    enhance(XMLHttpRequest.prototype)
  }

}
