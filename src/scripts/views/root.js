export function Root ({children}) {
  return (
    <div className='stretch-to-viewport-v'>
      <div className='flex-1 col-start-stretch'>
        {children}
      </div>
    </div>
  )
}

_.assign(Root, {
  componentWillMount () {
    const {location, ...props} = this.props

    if (!location) {
      throw Error(`Expected to receive route handler props, got nothing`)
    }

    // react-router stupidly marks first transition as 'REPLACE'
    signalRouteTransition.call(this, {...props, location: {...location, action: 'PUSH'}})
  },

  componentWillReceiveProps: signalRouteTransition,
})

function signalRouteTransition ({children: __, ...props}) {
  this.context.env.send({type: 'nav', value: props})
}
