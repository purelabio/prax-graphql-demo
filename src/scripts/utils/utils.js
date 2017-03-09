import {split, join, filter, map, mapValues, chunk} from 'lodash/fp'
import {pipe, ifelse} from 'prax'
import {maybeParseNum} from 'purelib'

// 'one=1; two=two; three='  ->  {one: 1, two: 'two', three: ''}
// 'blah'                    ->  {blah: null}
export const pairStringToDict = pipe(
  split(/;\s|;/),
  map(split('=')),
  filter(_.first),
  _.fromPairs,
  mapValues(maybeParseNum),
)

export const collectionToPairString = pipe(
  ifelse(_.isArray, chunk(2), _.toPairs),
  filter(_.first),
  map(join('=')),
  join('; ')
)
