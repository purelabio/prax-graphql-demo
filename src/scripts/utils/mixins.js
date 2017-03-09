import {effectMixin, stateMixin, onBlurMixin} from 'purelib/utils/mixins'
import {findDOMNode} from 'react-dom'
import {getIn, putIn, equal, bind, pipe, alter, val,
  isFunction, validate, validateEach, on} from 'prax'
import {validateForm, isPath} from 'purelib'
import {registerRelevantPaths, deregisterRelevantPaths} from '../features/relevance'

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
