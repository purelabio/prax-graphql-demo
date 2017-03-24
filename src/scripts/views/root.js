import {PraxComponent} from 'prax'

export class Root extends PraxComponent {
  subrender () {
    const {props: {children}} = this

    return (
      <div className='stretch-to-viewport-v'>
        <div className='flex-1 col-start-stretch'>
          {children}
        </div>
      </div>
    )
  }

  componentWillMount () {
    const {children: __, location, ...props} = this.props

    if (!location) {
      throw Error(`Expected to receive route handler props, got nothing`)
    }

    this.env.send({
      type: 'nav',
      // react-router stupidly marks first transition as 'REPLACE'
      value: {...props, location: {...location, action: 'PUSH'}},
    })
  }

  componentWillReceiveProps ({children: __, ...props}) {
    this.env.send({type: 'nav', value: props})
  }
}
