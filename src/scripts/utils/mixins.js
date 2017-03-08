import {findDOMNode} from 'react-dom'
import {getIn, putIn, putInBy, equal, bind, pipe, alter, val,
  prepend, ifelse, inc, isFunction, isDict, validate,
  validateEach, on} from 'prax'
import {uuid, isPath} from './utils'
import {isAncestorOf} from './dom'
import {validateForm} from './dom-forms'

export function effectMixin (makeEffect) {
  validate(isFunction, makeEffect)

  return {
    componentWillMount () {
      if (!this._unsubs) this._unsubs = []
      this._unsubs.push(this.env.addEffect(makeEffect.call(this)))
    },
    componentWillUnmount: flushUnsubs,
  }
}

export function watcherMixin (makeWatcher) {
  validate(isFunction, makeWatcher)

  return {
    componentWillMount () {
      if (!this._unsubs) this._unsubs = []
      this._unsubs.push(this.env.addWatcher(makeWatcher.call(this)))
    },
    componentWillUnmount: flushUnsubs,
  }
}

export function stateMixin (defaultState) {
  return {
    componentWillMount () {
      this.statePath = ['viewStates', uuid()]
      if (defaultState != null) this.env.swap(putIn, this.statePath, defaultState)
    },
    componentWillUnmount () {
      this.env.swap(putIn, this.statePath, null)
    },
  }
}

export function relevanceMixin (makePaths) {
  validate(isFunction, makePaths)

  function refreshPaths () {
    const relevantPaths = makePaths.call(this, this.props, this.env.state)
    validateEach(isPath, relevantPaths)
    this._relevantPaths = relevantPaths
  }

  return {
    componentWillMount () {
      refreshPaths.call(this)
      this.env.swap(registerRelevantPaths, this._relevantPaths)
    },
    componentWillReceiveProps () {
      const oldPaths = this._relevantPaths
      refreshPaths.call(this)
      if (!equal(oldPaths, this._relevantPaths)) {
        this.env.swap(pipe(
          alter(deregisterRelevantPaths, oldPaths),
          alter(registerRelevantPaths, this._relevantPaths),
        ))
      }
    },
    componentWillUnmount () {
      this.env.swap(deregisterRelevantPaths, this._relevantPaths)
    },
  }
}

export function onBlurMixin (findNode, fun) {
  return effectMixin(function () {
    return on({type: 'dom/focus-change'}, (_env, {value: {blurred, focused}}) => {
      const node = findNode.call(this, this)
      if (node && isAncestorOf(node, blurred) && !isAncestorOf(node, focused)) {
        fun.call(this, node)
      }
    })
  })
}

function flushUnsubs () {
  if (this._unsubs) {
    while (this._unsubs.length) this._unsubs.shift()()
  }
}

export function propsValidationMixin (propTests) {
  validate(isDict, propTests)
  validateEach(isFunction, _.values(propTests))

  return {
    componentWillMount () {
      for (const key in propTests) validate(propTests[key], this.props[key])
    },
    componentWillReceiveProps (props) {
      for (const key in propTests) validate(propTests[key], props[key])
    },
  }
}

export function autoformMixins (makeXhr) {
  validate(isFunction, makeXhr)

  return [
    {componentWillUnmount () {
      const {env: {state}, xhrPath} = this
      const xhr = getIn(state, xhrPath)
      if (xhr) xhr.abort()
    }},

    stateMixin(),

    {componentWillMount () {
      this.formPath     = [...this.statePath, 'form']
      this.xhrPath      = [...this.statePath, 'xhr']
      this.progressPath = [...this.statePath, 'progress']
      this.resultPath   = [...this.statePath, 'result']
    }},

    {
      validate () {
        const {env: {state}, formPath} = this
        return !_.isEmpty(getIn(state, formPath)) && validateForm(findDOMNode(this))
      },

      maybeSubmit () {
        const {env: {state}, xhrPath, validate, submit} = this
        if (!getIn(state, xhrPath) && validate()) submit()
      },

      submit () {
        const {env, xhrPath, resultPath} = this
        const xhr = makeXhr.call(this)
        xhr.addEventListener('readystatechange', () => {
          if (xhr.readyState === xhr.OPENED) env.swap(putIn, resultPath, null)
        })
        xhr.done(bind(env.swap, putIn, resultPath))
        // TODO to graphql
        // return restartXhrIn(env, xhrPath, xhr)
      },
    },
  ]
}

export const autoformBlurMixin = val(onBlurMixin(findDOMNode, function () {
  this.maybeSubmit()
}))

export const autoformDecayMixin = val(effectMixin(function () {
  return on({type: 'time/now'}, bind(clearOldResult, this.resultPath))
}))

function clearOldResult (resultPath, env, {value: now}) {
  const completedAt = getIn(env.state, [...resultPath, 'completedAt'])
  if ((now - completedAt) > 3000) env.swap(putIn, resultPath, null)
}

const relevancePrefix = alter(prepend, 'relevant')

export function registerRelevantPaths (state, paths) {
  return paths.map(relevancePrefix).reduce(incrementIn, state)
}

export function deregisterRelevantPaths (state, paths) {
  return paths.map(relevancePrefix).reduce(decrementIn, state)
}

function incrementIn (state, path) {
  return putInBy(state, path, incrementOrOne)
}

function decrementIn (state, path) {
  return putInBy(state, path, decrementOrNull)
}

function isPositive (value) {
  return _.isFinite(value) && value > 0
}

const incrementOrOne = ifelse(isPositive, inc, val(1))

function decrementOrNull (value) {
  return _.isFinite(value) && value > 1 ? value - 1 : null
}

