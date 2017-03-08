import {properties as domProperties} from 'react-dom/lib/DOMProperty'
import {get, scan, bind, defer, pipe, test, ifelse, ifthen, truthy, is, id, revise,
  isFunction, isBoolean, validate} from 'prax'
import {getf} from './reduce'

export {properties as domProperties} from 'react-dom/lib/DOMProperty'

const ifexists = bind(ifthen, truthy)

// Pixel measurements are inaccurate when the browser is zoomed in or out, so we
// have to use a small non-zero value in some geometry checks.
const OFFSET_NONE = 3

export const eventTarget = getf('target')

export const eventValue = getf('target', 'value')

export const eventChecked = getf('target', 'checked')

export function preventDefault (event) {
  event.preventDefault()
}

export function stopPropagation (event) {
  event.stopPropagation()
}

export function findNode (selector, elem = document) {
  return elem && elem.querySelector(selector) || null
}

export function findNodes (selector, elem = document) {
  return elem ? [].slice.call(elem.querySelectorAll(selector)) : []
}

export function eachSelector (fun, selector, elem) {
  return findNodes(selector, elem).forEach(fun)
}

export function findAncestor (fun, elem) {
  return !elem
    ? undefined
    : fun(elem)
    ? elem
    : findAncestor(fun, elem.parentNode)
}

export const findAncestorf = defer(findAncestor)

// ƒ(maybe ancestor, maybe descendant)
export const isAncestorOf = revise([defer(is), id], pipe(findAncestor, Boolean))

export function createDomElement (tag, props) {
  const element = document.createElement(tag)
  addDomElementProps(element, props)
  return element
}

// Expects the same kind of props as a React element in JSX. Automatically
// distributes them between attributes and properties.
export function addDomElementProps (element, props) {
  for (const propName in props) {
    if (domProperties[propName]) {
      addDomElementProp(element, propName, props[propName], domProperties[propName])
    }
  }
}

// Translated from 'react-dom/lib/DOMPropertyOperations.setValueForProperty'.
// Can't import and use it directly because it makes stupid assumptions
// and breaks when used outside of React rendering context.
function addDomElementProp (element, propName, propValue, {
  mutationMethod,
  mustUseProperty,
  propertyName,
  attributeName,
  attributeNamespace,
  hasBooleanValue,
  hasOverloadedBooleanValue,
}) {
  if (mutationMethod) {
    mutationMethod(element, propValue)
  }
  else if (mustUseProperty) {
    element[propertyName] = propValue
  }
  else if (attributeNamespace) {
    element.setAttributeNS(attributeNamespace, attributeName, String(propValue))
  }
  else if (hasBooleanValue || hasOverloadedBooleanValue && propValue === true) {
    element.setAttribute(attributeName, '')
  }
  else {
    element.setAttribute(attributeName, String(propValue))
  }
}

export function removeNode (node) {
  if (node && node.parentNode) node.parentNode.removeChild(node)
}

export function removeChildNodes (node) {
  if (node && node.removeChild)  {
    while (node.childNodes.length) node.removeChild(node.firstChild)
  }
}

export const removeNodesBySelector = bind(eachSelector, removeNode)

export function appendNode (parentNode, childNode) {
  if (parentNode && parentNode.appendChild && childNode) {
    parentNode.appendChild(childNode)
  }
}

export function appendNodeToHead (node) {
  appendNode(document.head, node)
}

export function tagName (elem) {
  return elem && elem.tagName
}

export function hasAttr (attr, elem) {
  return !!(elem && elem.hasAttribute && elem.hasAttribute(attr))
}

export function setAttr (attr, value, elem) {
  if (elem && elem.setAttribute) elem.setAttribute(attr, value)
}

export function getAttr (attr, elem) {
  return elem && elem.getAttribute && elem.getAttribute(attr) || ''
}

export function removeAttr (attr, elem) {
  if (elem && elem.removeAttribute) elem.removeAttribute(attr)
}

export const hasAttrf    = defer(hasAttr)
export const getAttrf    = defer(getAttr)
export const setAttrf    = defer(setAttr)
export const removeAttrf = defer(removeAttr)

export function hasClass (name, elem) {
  return !!(elem && elem.classList && elem.classList.contains(name))
}

export function addClass (name, elem) {
  if (elem && elem.classList && !elem.classList.contains(name)) {
    elem.classList.add(name)
  }
}

export function removeClass (name, elem) {
  if (elem && elem.classList) elem.classList.remove(name)
}

export const toggleClass = ifelse(hasClass, removeClass, addClass)

export const hasClassf = defer(hasClass)
export const addClassf = defer(addClass)
export const removeClassf = defer(removeClass)
export const toggleClassf = defer(toggleClass)

export function setStyle (style, elem) {
  _.mapKeys(style, (value, key) => {
    if (elem && elem.style) elem.style[key] = value
  })
}

export const scrollYToElem = ifexists(function scrollYToElem (elem, offsetY) {
  window.scrollTo(window.scrollX, (scan(elemOffset(elem), 'top') || 0) - (offsetY || 0))
})

export const elemOffset = ifexists(function elemOffset(elem) {
  const docElem = document.documentElement
  const box     = elem.getBoundingClientRect()
  const top     = box.top + window.pageYOffset - docElem.clientTop
  const left    = box.left + window.pageXOffset - docElem.clientLeft
  return {top, left}
})

export const withinViewport = ifexists(bind(withinNOfViewport, OFFSET_NONE))

export function withinNOfViewport (margin, element) {
  const {top, bottom} = element.getBoundingClientRect()
  return (
    top < -margin && bottom > -margin ||
    top > -margin && top < (window.innerHeight + margin)
  )
}

// True if the elements' paint rectangles overlap.
export function elementsIntersect (one, other) {
  if (!one || !other) return false

  const rectOne = one.getBoundingClientRect()
  const rectOther = other.getBoundingClientRect()

  const [lower, higher] = rectOne.top > rectOther.top ? [rectOne, rectOther] : [rectOther, rectOne]
  const [right, left] = rectOne.left > rectOther.left ? [rectOne, rectOther] : [rectOther, rectOne]

  return lower.top >= higher.top && lower.top <= higher.bottom &&
         right.left >= left.left && right.left <= left.right
}

export function copyToClipboard (input) {
  if (!input || !input.select) return

  input.focus()
  input.select()

  try {
    document.execCommand('copy')
    input.blur()
  } catch (err) {
    console.error(err)
  }
}

export const clip = pipe(
  eventTarget,
  findAncestorf(pipe(tagName, test('BUTTON'))),
  bind(findNode, '[data-clip]'), copyToClipboard
)

export function addEvent (target, name, fun, useCapture = false) {
  validate(isFunction, fun)
  validate(isBoolean, useCapture)

  target.addEventListener(name, fun, useCapture)

  return function removeEvent () {
    target.removeEventListener(name, fun, useCapture)
  }
}

export function delegateEvent (target, name, nodeTest, fun, useCapture = false) {
  validate(isFunction, nodeTest)
  validate(isFunction, fun)

  function listener (event) {
    const elem = findAncestor(nodeTest, event.target)
    if (elem) fun(elem, event)
  }

  target.addEventListener(name, listener, useCapture)

  return function removeEvent () {
    target.removeEventListener(name, listener, useCapture)
  }
}

// These key names correspond to the matching `event.key` values.
// We use `event.keyCode` because `event.key` is still unsupported in Webkit:
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key#Browser_compatibility
export const keyNames = {
  9: 'Tab',
  13: 'Enter',
  27: 'Escape',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  74: 'j',
  75: 'k',
}

export const keyCodeName = bind(get, keyNames)

export const eventKeyName = pipe(getf('keyCode'), keyCodeName)

export const testEventKey = pipe(test, bind(pipe, eventKeyName))

// Intended for file inputs and drag-drop events. In addition to returning the
// files, clears the input to prevent surprises that happen when opening the
// input dialog a second time and pressing Escape.
export function getEventFiles ({target, dataTransfer}) {
  const files = _.slice(target.files || scan(dataTransfer, 'files'))
  if (target.value != null) target.value = null
  return files
}

export const getEventFile = pipe(getEventFiles, _.first)
