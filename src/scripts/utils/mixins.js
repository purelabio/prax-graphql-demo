import {effectMixin, stateMixin, onBlurMixin} from 'purelib/utils/mixins'
import {findDOMNode} from 'react-dom'
import {getIn, putIn, bind, val,
  isFunction, validate, on} from 'prax'
import {validateForm} from 'purelib'

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
