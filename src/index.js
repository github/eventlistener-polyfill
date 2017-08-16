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
    var callback = originalCallback
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

    if (!listeners.has(this)) listeners.set(this, new Map())
    var elementMap = listeners.get(this)
    if (!elementMap.has(originalCallback)) elementMap.set(originalCallback, new Map())
    elementMap.get(originalCallback).set('' + Number(passive) + Number(once) + Number(capture), callback)

    originalAddEventListener.call(this, name, callback, capture)
  }

  proto.removeEventListener = function(name, originalCallback, optionsOrCapture) {
    var capture = Boolean(typeof optionsOrCapture === 'object' ? optionsOrCapture.capture : optionsOrCapture)

    var elementMap = listeners.get(this)
    if (!elementMap) return
    var callbackMap = elementMap.get(originalCallback)
    if (!callbackMap) return

    callbackMap.forEach(function(callback, optionsHash) {
      var callbackCapture = optionsHash[2] === '1'
      if (callbackCapture !== capture) return // when unbinding, capture is the only option that counts
      originalRemoveEventListener.call(this, name, callback, callbackCapture)
      callbackMap.delete(optionsHash)
    }, this)

    if (callbackMap.size === 0) {
      elementMap.delete(originalCallback)
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
