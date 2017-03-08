import {reduce, mergeWith} from 'lodash-fp'
import {get, putIn, bind, pipe, rest, id, is, not, ifelse, ifthen,
  test, testOr, inc, dec,
  isFunction, isObject, validate} from 'prax'
import {onlyString} from './format'
import {findAncestor, getAttr, findNodes, hasAttrf, keyCodeName, testEventKey} from './dom'
import {fitIndex, reify, isPath, match, prune, nthMatch, True} from './utils'
import {undoAt} from './reduce'

const flushInputsPath = ['view', 'flushInputs']

// Similar to `merge`, but has a special merge tactic for `className`.
export const mix = rest(reduce(mergeWith(mergeClassName), {}), 0)

function mergeClassName (left, right, key) {
  return key === 'className'
    ? `${onlyString(left)} ${onlyString(right)}`.trim()
    : undefined
}

export function act (value) {
  return value ? 'active' : ''
}

export function bindValue ({read, env, path, transform = id, fallback = ''}) {
  validate(isFunction, read)
  validate(isObject, env)
  validate(isPath, path)

  return {
    value: reify(read(...path), fallback),
    onChange ({target: {value}}) {
      const newValue = transform(value)
      env.swap(putIn, path, is(newValue, fallback) ? null : newValue)
    }
  }
}

export function bindValueWithUndo (config) {
  const {env, path, formPath} = config
  validate(isPath, formPath)

  return {
    ...bindValue(config),
    onKeyDown: ifthen(
      testEventKey('Escape'),
      bind(env.swap, undoAt, path, formPath)
    )
  }
}

export function bindCheck ({read, env, path}) {
  return {
    checked: read(...path) || false,
    onChange ({target: {checked}}) {
      env.swap(putIn, path, checked)
    }
  }
}

// Input must be hex-rgb-style: '#abcdef'.
export function contrastingGrayscaleColor (hexColorString) {
  const [__, r, g, b] = _.map(match(hexRgbReg, hexColorString), parseHex)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
  return (yiq >= 128) ? 'black' : 'white'
}

const hexRgbReg = /#.*([\dabcdef]{2})([\dabcdef]{2})([\dabcdef]{2})/i

function parseHex (num) {
  return parseInt(num, 16)
}

export function moveCursor (event) {
  const node = event.target
  const host = findAncestor(isNavHost, node)
  if (!host) return

  const columnId = getAttr('data-nav-col-id', node)

  const nodes = shouldMoveVertically(event)
    ? findNodes(`[data-nav-col-id="${columnId}"]`, host)
    : shouldMoveHorizontally(event)
    ? findNodes('[data-nav-col-id]', host)
    : []

  if (!_.includes(nodes, node)) return

  const index = nodes.indexOf(node)

  const vector = shouldIncPosition(event) ? inc : shouldDecPosition(event) ? dec : null

  const nextIndex = fitIndex(vector ? vector(index) : index, nodes.length)

  const nextNode = nodes[nextIndex]

  if (nextNode) {
    event.preventDefault()
    nextNode.focus()
    selectAll(nextNode)
  }
}

const selectAll = ifthen(test({select: _.isFunction}), node => node.select())

// https://html.spec.whatwg.org/multipage/forms.html#do-not-apply
// Inputs excluded by this test produce a synchronous EXCEPTION when trying to
// access `selectionStart` or `selectionRange`. However, they still let you SET
// them via `.select()`.
const supportsSelect = testOr(
  {tagName: 'TEXTAREA'},
  {tagName: 'INPUT', type: /^(text|search|password|tel|url)$/},
)

const isNavHost = hasAttrf('data-nav-host')

const noModButShift = {altKey: false, ctrlKey: false, metaKey: false}
const noMod = {...noModButShift, shiftKey: false}

const testKeyName = pipe(testOr, bind(pipe, keyCodeName))

const shouldMoveVertically = testOr(
  {keyCode: testKeyName('ArrowUp', 'ArrowDown'), ...noMod},
  {keyCode: testKeyName('Enter'), ...noModButShift, target: {
    tagName: not(test('TEXTAREA'))
  }},
)

const shouldMoveHorizontally = testOr(
  {keyCode: testKeyName('Tab'), ...noModButShift},
  {
    keyCode: testKeyName('ArrowLeft'),
    ...noMod,
    target: ifelse(
      supportsSelect,
      ({selectionStart}) => selectionStart === 0,
      True
    )
  },
  {
    keyCode: testKeyName('ArrowRight'),
    ...noMod,
    target: ifelse(
      supportsSelect,
      ({value, selectionEnd}) => selectionEnd >= _.size(value),
      True
    )
  },
)

const shouldDecPosition = testOr(
  {keyCode: testKeyName('ArrowLeft', 'ArrowUp')},
  {keyCode: testKeyName('Enter', 'Tab'), shiftKey: true},
)

const shouldIncPosition = testOr(
  {keyCode: testKeyName('ArrowRight', 'ArrowDown')},
  {keyCode: testKeyName('Enter', 'Tab'), shiftKey: false},
)

export function em (value) {
  return _.isFinite(value) ? `${value}em` : ''
}

export function rem (value) {
  return _.isFinite(value) ? `${value}rem` : ''
}

export function rowGroupClass (groupFlag, prevGroupFlag) {
  const oddGroup = groupFlag === false
  return prune(
    `${oddGroup ? 'bg-04' : ''}
     ${groupFlag === prevGroupFlag ? (oddGroup ? 'shadow-in-white-t' : 'shadow-in-04-t') : ''}`
  )
}

export const minBlockEdge = '2.5em'

// Usage:
//   mapDependent(bind(addGroupFlagBy, x => someValue), someList)
export function addGroupFlagBy (fun, next, prev) {
  const prevGroupFlag = get(prev, 'groupFlag')
  return {
    ...next,
    prevGroupFlag,
    groupFlag: is(fun(prev), fun(next)) ? prevGroupFlag : !prevGroupFlag,
  }
}

export function fileIcon ({type}) {
  return (
    /pdf/          .test(type)  ?  'file-pdf-o'         :
    /image/        .test(type)  ?  'file-image-o'       :
    /audio/        .test(type)  ?  'file-audio-o'       :
    /video/        .test(type)  ?  'file-video-o'       :
    /text|epub/    .test(type)  ?  'file-text-o'        :
    /archive|zip/  .test(type)  ?  'file-archive-o'     :
    /word/         .test(type)  ?  'file-word-o'        :
    /powerpoint/   .test(type)  ?  'file-powerpoint-o'  :
    /excel/        .test(type)  ?  'file-excel-o'       :
                                   'file-o'
  )
}

// '.'              ->  '.'
// '.one'           ->  '.one'
// 'one.two'        ->  'one'
// 'one.two.three'  ->  'one.two'
export function fileNameWithoutExtension ({name}) {
  return nthMatch(0, /(.+(?=\.))|(.+)/, name)
}

// '.'              ->  ''
// '.one'           ->  ''
// 'one.two'        ->  '.two'
// 'one.two.three'  ->  '.three'
export function fileExtension ({name}) {
  return nthMatch(1, /(?:[^.]+)(\..*)/, name)
}

export function collapsingInputProps ({env, read, focusPath, fullProps}) {
  const focused = read(...focusPath)

  return {
    onFocus: bind(env.swap, putIn, focusPath, true),
    onBlur: bind(env.swap, putIn, focusPath, false),
    ...(focused
      ? {
        className: `flex-1 ${readFlushInputClass(read)}`,
        style: {transition: 'none'},
        ...fullProps,
      }
      : {
        value: '',
        onChange: _.noop,
        placeholder: faChars.edit,
        className: 'input-flush cursor-pointer align-center margin-0x5-l placeholder-color-54',
        style: {fontFamily: 'FontAwesome', maxWidth: '2em', transition: 'none'},
      }
    ),
  }
}

export function readFlushInputClass (read) {
  return `input-inline ${read(...flushInputsPath) ? 'input-flush transition-all-short' : ''}`
}
