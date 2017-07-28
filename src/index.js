let passiveSupported = false
let onceSupported = false
function noop() {}
try {
  const options = Object.create({}, {
    passive: {get: function() { passiveSupported = true }},
    once: {get: function() { onceSupported = true }},
  })
  window.addEventListener('test', noop, options)
  window.removeEventListener('test', noop, options)
} catch (e) { /* */ }

const enhance = module.exports = function enhance(proto) {
  const originalAddEventListener = proto.addEventListener
  const originalRemoveEventListener = proto.removeEventListener

  const listeners = new WeakMap()
  proto.addEventListener = function(name, originalCallback, optionsOrCapture) {
    let callback = originalCallback
    const options = typeof optionsOrCapture === 'boolean' ? {capture: optionsOrCapture} : optionsOrCapture || {}
    const passive = Boolean(options.passive)
    const once = Boolean(options.once)
    const capture = Boolean(options.capture)

    if (!onceSupported && once) {
      const oldCallback = callback
      callback = function(event) {
        this.removeEventListener(name, originalCallback, options)
        oldCallback.call(this, event)
      }
    }

    if (!passiveSupported && passive) {
      const oldCallback = callback
      callback = function(event) {
        event.preventDefault = noop
        oldCallback.call(this, event)
      }
    }

    if (!listeners.has(this)) listeners.set(this, new Map())
    const elementMap = listeners.get(this)
    if (!elementMap.has(originalCallback)) elementMap.set(originalCallback, new Map())
    elementMap.get(originalCallback).set('' + Number(passive) + Number(once) + Number(capture), callback)

    originalAddEventListener.call(this, name, callback, capture)
  }

  proto.removeEventListener = function(name, originalCallback, optionsOrCapture) {
    const capture = Boolean(typeof optionsOrCapture === 'object' ? optionsOrCapture.capture : optionsOrCapture)

    const elementMap = listeners.get(this)
    if (!elementMap) return
    const callbackMap = elementMap.get(originalCallback)
    if (!callbackMap) return

    callbackMap.forEach(function(callback, optionsHash) {
      const callbackCapture = optionsHash[2] === '1'
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
