import {cloneElement} from 'react'
import {equalBy, is, bind, test, testOr, testAnd, or, not, id, ifonly, includes} from 'prax'
import {condTest, Null} from './utils'

const isCustomElement = test({type: _.isFunction})

export function maybeAddProps (props, element) {
  return isCustomElement(element) ? cloneElement(element, props) : element
}

export function addProps (props, element) {
  return cloneElement(element, props)
}

export function deepMapElement (fun, element) {
  return _.isArray(element)
    ? deepMapElements(fun, element)
    : deepMapChildren(fun, fun(element))
}

function deepMapElements (fun, elements) {
  return elements.map(bind(deepMapElement, fun))
}

function deepMapChildren (fun, element) {
  return !element || !element.props || !element.props.children
    ? element
    : _.isArray(element.props.children)
    ? replaceChildren(element, deepMapElements(fun, element.props.children))
    : replaceChild(element, deepMapElement(fun, element.props.children))
}

function replaceChildren (element, children) {
  return equalBy(is, element.props.children, children)
    ? element
    : cloneElement(element, {children})
}

function replaceChild (element, child) {
  return is(element.props.children, child)
    ? element
    : cloneElement(element, {children: child})
}

const isNonTextInput = testOr(
  {type: 'input', props: {type: testOr('checkbox', 'radio', 'file')}},
)

const isTextInput = testOr(
  {type: testOr('textarea', 'select')},
  testAnd({type: 'input'}, not(isNonTextInput)),
)

export const lockInputs = bind(deepMapElement, condTest(
  isTextInput, bind(addProps, {readOnly: true}),
  isNonTextInput, bind(addProps, {disabled: true}),
  id,
))

export const disableInputs = bind(
  deepMapElement,
  ifonly(or(isTextInput, isNonTextInput), bind(addProps, {disabled: true}))
)

export function hideByKeys (keys, elementOrElements) {
  return deepMapElement(
    ifonly(test({key: bind(includes, keys)}), Null),
    elementOrElements
  )
}
