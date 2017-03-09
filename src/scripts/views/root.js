export function Root ({children}) {
  return (
    <div className='stretch-to-viewport-v'>
      <div className='flex-1 container col-start-stretch'>
        {children}
      </div>
    </div>
  )
}

Root.componentWillMount = function () {
  const {location, ...props} = this.props
  // react-router stupidly marks first transition as 'REPLACE'
  signalRouteTransition.call(this, {location: {...location, action: 'PUSH'}, ...props})
}

Root.componentWillReceiveProps = signalRouteTransition

function signalRouteTransition ({children: __, ...props}) {
  this.env.send({type: 'route', value: {...props.location, params: props.params, nav: props}})
}
