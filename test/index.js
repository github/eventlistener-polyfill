/* eslint-env mocha */
require('core-js/es6/weak-map')
var polyfillEventTarget = require('../src')
var assert = require('assert')

function testSuite(eventTarget, listenerType) {
  return function() {
    var i = 0
    var listeners = {
      'Function': function() { i++ },
      'EventListener': { handleEvent: function() { i++ } },
      'Ambiguous': (function() {
        function listener() { i++ }
        listener.handleEvent = function() {}
        return listener
      })()
    }
    var increment = listeners[listenerType]

    function event(name) {
      var ev = document.createEvent("CustomEvent")
      ev.initCustomEvent(name, false, false, null)
      return ev
    }

    beforeEach(function() {
      i = 0
      eventTarget.removeEventListener('test', increment)
      eventTarget.removeEventListener('test', increment, true)
    })

    describe('unexpected behaviours', function() {

      it('deffers to browser behavior for invalid arguments', function() {
        try {
          // either browsers will silently ignore this call, or they'll throw an error specifically about `addEventListener`
          // if neither of those happen, an error happened in our code.
          eventTarget.addEventListener('test1', 'this is invalid, but someone is doing this in the wild!', {})
        } catch (e) {
          // ok... I lied... Safari throws "Type error" not anything about addEventListener
          assert.ok(/(addEventListener|Type error)/.test(e.message), 'error was thrown internally to our code')
        }
      })

    })

    describe('expected behaviours', function() {
      it('can bind and unbind the same event functions to different event names', function() {
        eventTarget.addEventListener('test1', increment)
        eventTarget.addEventListener('test2', increment)
        eventTarget.dispatchEvent(event('test1'))
        eventTarget.dispatchEvent(event('test2'))
        eventTarget.removeEventListener('test1', increment)
        eventTarget.removeEventListener('test2', increment)
        eventTarget.dispatchEvent(event('test1'))
        eventTarget.dispatchEvent(event('test2'))
        assert.equal(i, 2, 'test1 event listener was not unbound properly and fired ' + i + ' times')
      })

      it('can bind and unbind simple event listeners', function() {
        eventTarget.addEventListener('test', increment)
        eventTarget.dispatchEvent(event('test'))
        eventTarget.removeEventListener('test', increment)
        eventTarget.dispatchEvent(event('test'))
        assert.equal(i, 1, 'test event listener was not unbound properly and fired ' + i + ' times')
      })
    })

    describe('once option', function() {

      it('only fires { once: true } event listeners once', function() {
        eventTarget.addEventListener('test', increment, {once: true})
        eventTarget.dispatchEvent(event('test'))
        eventTarget.dispatchEvent(event('test'))
        assert.equal(i, 1, 'test event listener was not unbound properly and fired ' + i + ' times')
      })

      it('can unbind { once: true } without specifying options', function() {
        eventTarget.addEventListener('test', increment, {once: true})
        eventTarget.removeEventListener('test', increment)
        eventTarget.dispatchEvent(event('test'))
        assert.equal(i, 0, 'test event listener was not unbound properly and fired ' + i + ' times')
      })

      it('unbinds even if listener throws', function() {
        var error = new Error('listener threw an error')
        eventTarget.addEventListener('test', function() { throw error }, {once: true})
        window.onerror = function(thrown) {
          assert.equal(thrown, error, 'an error was thrown, but not the expected one')
        }
        eventTarget.dispatchEvent(event('test'))
        delete eventTarget.dispatchEvent(event('test'))
      })

    })

    describe('passive option', function() {

      it('noops preventDefault with { passive: true }', function() {
        var ev = null
        eventTarget.addEventListener('test', function(_ev) { ev = _ev }, {passive: true})
        eventTarget.dispatchEvent(event('test'))
        assert(/noop/.test(ev.preventDefault) || /\[native code\]/.test(ev.preventDefault),
          'event.preventDefault doesnt look like native or custom implementation')
      })

      it('never prevents default', function() {
        eventTarget.addEventListener('test', function(event) { event.preventDefault() }, {passive: true})
        var defaultNotPrevented = eventTarget.dispatchEvent(event('test'))
        assert(defaultNotPrevented, 'default was prevented')
      })

      it('can unbind { passive: true } without specifying options', function() {
        eventTarget.addEventListener('test', increment, {passive: true})
        eventTarget.removeEventListener('test', increment)
        eventTarget.dispatchEvent(event('test'))
        assert.equal(i, 0, 'test event listener was not unbound properly and fired ' + i + ' times')
      })

    })

    describe('capture option', function() {

      it('will not unbind a { capture: false } when unbinding a { capture: true } listener', function() {
        eventTarget.addEventListener('test', increment, {capture: true})
        eventTarget.addEventListener('test', increment, {capture: false})
        eventTarget.removeEventListener('test', increment, {capture: true})
        eventTarget.dispatchEvent(event('test'))
        assert.equal(i, 1, 'test event listener was not unbound properly and fired ' + i + ' times')
      })

      it('will not unbind a { capture: true } when unbinding a { capture: false } listener', function() {
        eventTarget.addEventListener('test', increment, {capture: true})
        eventTarget.addEventListener('test', increment, {capture: false})
        eventTarget.removeEventListener('test', increment, {capture: false})
        eventTarget.dispatchEvent(event('test'))
        assert.equal(i, 1, 'test event listener was not unbound properly and fired ' + i + ' times')
      })

      it('will unbind a { capture: true } as just `true`', function() {
        eventTarget.addEventListener('test', increment, {capture: true})
        eventTarget.removeEventListener('test', increment, true)
        eventTarget.dispatchEvent(event('test'))
        assert.equal(i, 0, 'test event listener was not unbound properly and fired ' + i + ' times')
      })

      it('will unbind a { capture: false } as just `false`', function() {
        eventTarget.addEventListener('test', increment, {capture: false})
        eventTarget.removeEventListener('test', increment, false)
        eventTarget.dispatchEvent(event('test'))
        assert.equal(i, 0, 'test event listener was not unbound properly and fired ' + i + ' times')
      })

      it('will unbind a { passive: true, capture: true } with just `true`', function() {
        eventTarget.addEventListener('test', increment, {passive: true, capture: true})
        eventTarget.removeEventListener('test', increment, true)
        eventTarget.dispatchEvent(event('test'))
        assert.equal(i, 0, 'test event listener was not unbound properly and fired ' + i + ' times')
      })

      it('will unbind a { once: true, capture: true } with just `true`', function() {
        eventTarget.addEventListener('test', increment, {once: true, capture: true})
        eventTarget.removeEventListener('test', increment, true)
        eventTarget.dispatchEvent(event('test'))
        assert.equal(i, 0, 'test event listener was not unbound properly and fired ' + i + ' times')
      })

      it('will not unbind a { capture: true } when unbinding a no-options listener', function() {
        eventTarget.addEventListener('test', increment, {capture: true})
        eventTarget.addEventListener('test', increment, {capture: false})
        eventTarget.removeEventListener('test', increment)
        eventTarget.dispatchEvent(event('test'))
        assert.equal(i, 1, 'test event listener was not unbound properly and fired ' + i + ' times')
      })

      it('will unbind { once: true } when capture is false', function() {
        eventTarget.addEventListener('test', increment, {once: true})
        eventTarget.removeEventListener('test', increment, {capture: false})
        eventTarget.dispatchEvent(event('test'))
        eventTarget.dispatchEvent(event('test'))
        assert.equal(i, 0, 'test event listener was not unbound properly and fired ' + i + ' times')
      })

      it('will not unbind { once: true } when capture is true', function() {
        eventTarget.addEventListener('test', increment, {once: true})
        eventTarget.addEventListener('test', increment, {capture: true})
        eventTarget.removeEventListener('test', increment, {capture: true})
        eventTarget.dispatchEvent(event('test'))
        assert.equal(i, 1, 'test event listener was not unbound properly and fired ' + i + ' times')
      })


      it('will unbind { passive: true } when capture is false', function() {
        eventTarget.addEventListener('test', increment, {passive: true})
        eventTarget.removeEventListener('test', increment, {capture: false})
        eventTarget.dispatchEvent(event('test'))
        assert.equal(i, 0, 'test event listener was not unbound properly and fired ' + i + ' times')
      })

      it('will not unbind { passive: true } when capture is true', function() {
        eventTarget.addEventListener('test', increment, {passive: true})
        eventTarget.addEventListener('test', increment, {capture: true})
        eventTarget.removeEventListener('test', increment, {capture: true})
        eventTarget.dispatchEvent(event('test'))
        assert.equal(i, 1, 'test event listener was not unbound properly and fired ' + i + ' times')
      })

    })

  }
}

['Function', 'EventListener', 'Ambiguous'].forEach(function(listenerType) {
  describe(listenerType + ' listener', function() {

    describe('Window add/removeEventListener', testSuite(window, listenerType))

    describe('Document add/removeEventListener', testSuite(document, listenerType))

    describe('Div add/removeEventListener', testSuite(document.createElement('div'), listenerType))

    describe('TextNode add/removeEventListener', testSuite(document.createTextNode('testing'), listenerType))

    describe('XHR add/removeEventListener', testSuite(new XMLHttpRequest(), listenerType))
  })
})


describe('Manual Polyfill', function() {

  it('add `addEventListener` and `removeEventListener` to given object', function() {
    var target = {}
    polyfillEventTarget(target)
    assert(target.addEventListener, 'target doesnt have addEventListener')
    assert(target.addEventListener, 'target doesnt have removeEventListener')
  })

})
