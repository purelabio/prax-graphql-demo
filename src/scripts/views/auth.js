import {Button} from './misc'

export function Auth0SignIn (__, {env}) {
  return (
    <div className='padding-2'>
      <div className='container col-start-center children-margin-0x5-v'>
        <div className='width-400px padding-2 rounded'>
          <Button className='button-size-l button-gray width-100p font-3'
                  onClick={() => env.auth0Lock.show()} >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  )
}