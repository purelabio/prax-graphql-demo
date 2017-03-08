import {trim, replace} from 'lodash-fp'
import {pipe, ifelse, id, val} from 'prax'
import {firstMatch, isInvalidDate} from './utils'

// Which is better?
export const urlRegex        = /\bhttps?:\/\/([^.,;!?\s]|[.,?](?=[^.,;!?\s]))+/
export const anotherUrlRegex = /^https?:\/\/([^ "]+)(\/|\/([\w#!:.?+=&%@!\-\/]))?$/

export const onlyString = ifelse(_.isString, id, val(''))

// Removes everything except digits from the given string.
// E.g. formats phone number from international to required by backend API:
//   +79161112233  ->  79161112233
export const onlyDigits = pipe(onlyString, replace(/\D/g, ''))

export const nonEmptyStr = ifelse(id, trim, val(''))

export const onlyOrigin = pipe(onlyString, replace(/^(ftp|http|https):\/\/[^ "]+$/, ''))

export function percentageToString (fraction) {
  return _.isFinite(fraction) ? (fraction * 100).toFixed(1) : ''
}

export function formatPercentage (value) {
  return _.isFinite(value) ? `${percentageToString(value)}%` : ''
}

export function formatDateShort (date) {
  return firstMatch(/(\d\d\d\d-\d\d-\d\d)/, new Date(date).toISOString())
}

export function maybeFormatDateShort (value) {
  const date = new Date(value)
  return isInvalidDate(date)
    ? ''
    : firstMatch(/(\d\d\d\d-\d\d-\d\d)/, date.toISOString())
}

// May return 'Invalid Date' if the value is malformed.
export function formatDateLong (date) {
  return new Date(date).toDateString()
}

// WTF
// TODO rewrite functionally, write tests.
//
// Example rules:
//   [
//     [/some-text/, match => <span>{match[0]}</span>],
//     ['more-text', match => <span>{match[0]}</span>],
//   ]
//
// Rule = [<argument for String.prototype.match>, ƒ(match)]
//
export function formatLine (rules, text) {
  const [match, fun] = findMatch(rules, text)
  if (!match) return [text]

  const init = text.slice(0, match.index)
  const mean = fun(match)
  const rest = text.slice(match.index + match[0].length)

  const out = []

  if (init) out.push(...formatLine(rules, init))
  if (mean) out.push(mean)
  if (rest) out.push(...formatLine(rules, rest))

  return out
}

function findMatch (rules, text) {
  for (let i = -1; ++i < rules.length;) {
    const [pattern, fun] = rules[i]
    const match = text.match(pattern)
    if (match) return [match, fun]
  }
  return []
}
