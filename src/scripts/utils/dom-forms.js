import {or, bind, pipe, pipeAnd, seq, ifthen, val} from 'prax'
import {findAncestor, hasAttr, setAttr, removeAttr, preventDefault, eventTarget, scrollYToElem,
        withinViewport, eachSelector, findNode, findNodes, getAttrf} from './dom'

// Experimental form props with semi-native form validation that works
// consistently between browsers. Use together with `data-form-label` attribute
// on input parents and native validation attributes, such as `required`, on
// inputs. You can also set the `data-form-label-error` attribute (it must be an
// i18n key) to manually indicate an error.
//
// Usage:
//   <form {...formProps(submit)} />
// To submit programmatically:
//   formNode.submit()
export function formProps (submit) {
  return {
    onSubmit: seq(preventDefault, pipe(eventTarget, ifthen(validateForm, submit))),
    onChange: pipe(eventTarget, hideAncestorTooltip),
    noValidate: true,
  }
}

// Usage:
//   <div {...pseudoFormProps()} />
// To submit programmatically:
//   if (validateForm(formNode)) submit()
export function pseudoFormProps () {
  return {
    onChange: pipe(eventTarget, hideAncestorTooltip),
  }
}

export function formLabelProps (errorMsg) {
  return {
    'data-form-label': true,
    'data-form-label-error': errorMsg,
    ...pseudoFormProps(),
  }
}

// In an earlier implementation, this focused the first failed input, but when
// form submission is triggered by blur, two adjacent forms with invalid inputs
// can get stuck in a loop, taking focus from one another and submitting
// infinitely.
export function validateForm (node) {
  hideTooltips(node)
  const labels = failedLabels(node)

  if (labels.length) {
    showTooltips(labels)
    if (!withinViewport(_.head(labels))) scrollYToElem(_.head(labels))
    return false
  }
  else {
    return true
  }
}

function hideTooltips (form) {
  eachSelector(hideTooltip, '[data-form-label]', form)
}

function failedLabels (form) {
  return _.filter(findNodes('[data-form-label]', form), labelError)
}

const isLabel = bind(hasAttr, 'data-form-label')

const findLabel = bind(findAncestor, isLabel)

const hideAncestorTooltip = pipeAnd(findLabel, hideTooltip)

export function hideTooltip (elem) {
  removeAttr('aria-label', elem)
  removeAttr('aria-label-show', elem)
}

function showTooltips (elems) {
  elems.forEach(showTooltip)
}

export function showTooltip (label) {
  const text = labelError(label)
  if (text) {
    setAttr('aria-label', text, label)
    setAttr('aria-label-show', '', label)
  }
}

const labelError = or(getAttrf('data-form-label-error'), pipeAnd(findInput, inputError))

function findInput (elem) {
  return findNode('input,textarea,select', elem)
}

// https://developer.mozilla.org/en-US/docs/Web/API/ValidityState
// Error flags:
//   badInput
//   customError
//   patternMismatch
//   rangeOverflow
//   rangeUnderflow
//   stepMismatch
//   tooLong
//   typeMismatch
//   valueMissing
function inputError (input) {
  const {validity: {valid, valueMissing, patternMismatch}} = input
  return valid
    ? null
    : patternMismatch
    ? validationErrors.pattern(input)
    : valueMissing
    ? validationErrors.required(input)
    : validationErrors.invalid(input)
}

export const validationErrors = {
  required: val('Field required'),
  invalid: val('Invalid input'),
  pattern: ({pattern}) => `Failed to match provided pattern: ${pattern}`,
}
