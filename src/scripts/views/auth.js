import {bind, seq} from 'prax'
import {bindValue, nonEmptyStr, preventDefault} from '../utils'
import {Link} from './link'
import {Button} from './misc'
import {usernamePath, passwordPath, errorMsgPath,
  readSyncingAuth, syncLogin} from '../features/auth'

/**
 * TODO
 *   use dom form utils
 */

// const providers = ['google', 'facebook', 'twitter', 'github']
const providers = []

export function SignUp (__, {read, env}) {
  const syncing = readSyncingAuth(read)
  return (
    <div className='padding-2'>
      <div className='container col-start-center children-margin-0x5-v'>
        <div className='width-400px padding-2 rounded'>
          <form className='col-start-center children-margin-0x5-v'
                onSubmit={preventDefault}>
            <h2 className='font-4'>
              Sign Up
            </h2>
            <input className='block width-100p input'
                   type='text'
                   placeholder='Username'
                   autoFocus
                   {...bindValue({read, env, path: usernamePath, transform: nonEmptyStr})}
                   readOnly={syncing} />
            <input className='block width-100p input'
                   type='password'
                   placeholder='Password'
                   {...bindValue({read, env, path: passwordPath, transform: nonEmptyStr})}
                   readOnly={syncing} />
            <div className='row-center-center color-red align-center'>
              {read(...errorMsgPath)}
            </div>
            <Button type='submit'
                    className='button-size-l button-gray width-100p font-3'
                    disabled={syncing}>
                Create Account
            </Button>
            <div className='row-center-start children-margin-0x5-h font-5'>
              {_.map(providers, provider => (
                <ButtonByProvider key={provider}
                                  provider={provider} />
              ))}
            </div>
            <Agreement />
          </form>
        </div>
        <AlreadyHaveAccount />
      </div>
    </div>
  )
}

export function SignUpForm ({className, style}, {read, env}) {
  const syncing = readSyncingAuth(read)
  return (
    <form className={`col-start-stretch children-margin-0x5-v ${className || ''}`}
          style={style}
          onSubmit={preventDefault}>
      <input className='input block width-100p'
             type='text'
             placeholder='Username'
             autoFocus
             {...bindValue({read, env, path: usernamePath, transform: nonEmptyStr})}
             readOnly={syncing} />
      <input className='input block width-100p'
             type='password'
             placeholder='Password'
             {...bindValue({read, env, path: passwordPath, transform: nonEmptyStr})}
             readOnly={syncing} />
      <div className='row-center-center color-red align-center'>
        {read(...errorMsgPath)}
      </div>
      <Button type='submit'
              className='button-size-l button-gray'
              disabled={syncing}>
        Create Account
      </Button>
      <div className='row-center-start children-margin-0x5-h font-5'>
        {_.map(providers, provider => (
          <ButtonByProvider key={provider}
                            provider={provider} />
        ))}
      </div>
      <Agreement />
    </form>
  )
}

export function Recover (__, {read, env}) {
  const syncing = readSyncingAuth(read)
  return (
    <div className='padding-2 container'>
      <div className='col-start-center children-margin-0x5-v'>
        <div className='width-400px padding-2 rounded'>
          <form className='col-start-center children-margin-0x5-v'
                onSubmit={preventDefault}>
            <h2 className='font-4'>
              Recover Password
            </h2>
            <input className='block width-100p input'
                   placeholder='Username'
                   autoFocus
                   {...bindValue({read, env, path: usernamePath, transform: nonEmptyStr})}
                   readOnly={syncing} />
            <div className='row-center-center color-red align-center'>
              {read(...errorMsgPath)}
            </div>
            <Button type='submit'
                    className='button-size-l button-gray width-100p font-3'
                    disabled={syncing}>
              Recover
            </Button>
          </form>
        </div>
        <AlreadyHaveAccount />
      </div>
    </div>
  )
}

export function RecoverDone () {
  return (
    <div className='padding-2'>
      <div className='container col-start-center children-margin-0x5-v'>
        <div className='width-400px padding-2 rounded'>
          <div className='col-start-center children-margin-0x5-v'>
            <h2 className='font-4'>
              Recovery Successful
            </h2>
            <Link className='row-center-center button-size-l button-gray width-100p font-3'
                  to='auth/sign-in'>
              Sign In
            </Link>
          </div>
        </div>
        <AlreadyHaveAccount />
      </div>
    </div>
  )
}

export function SignIn (__, {read, env}) {
  const syncing = readSyncingAuth(read)
  const username = read(...usernamePath)
  const password = read(...passwordPath)

  return (
    <div className='padding-2'>
      <div className='container col-start-center children-margin-0x5-v'>
        <div className='width-400px padding-2 rounded'>
          <form className='col-start-center children-margin-0x5-v'
                onSubmit={seq(preventDefault, bind(syncLogin, env, username, password))}>
            <h2 className='font-4'>
              Sign In
            </h2>
            <input className='block width-100p input'
                   type='text'
                   placeholder='Username'
                   autoFocus
                   {...bindValue({read, env, path: usernamePath, transform: nonEmptyStr})}
                   readOnly={syncing} />
            <input className='block width-100p input'
                   type='password'
                   placeholder='Password'
                   {...bindValue({read, env, path: passwordPath, transform: nonEmptyStr})}
                   readOnly={syncing} />
            <div className='row-center-center color-red align-center'>
              {read(...errorMsgPath)}
            </div>
            <Button type='submit'
                    className='button-size-l button-gray width-100p font-3'
                    disabled={syncing}>
              Sign In
            </Button>
            <div className='row-center-center color-gray cursor-pointer'>
              <Link to='auth/recover'>Recover password</Link>
            </div>
            <div className='row-center-start children-margin-0x5-h font-5'>
              {_.map(providers, provider => (
                <ButtonByProvider key={provider}
                                  provider={provider}
                                  className='button-size-l' />
              ))}
            </div>
            <Agreement />
          </form>
        </div>
        <HaveNoAccount />
      </div>
    </div>
  )
}

function ButtonByProvider ({provider, className}, {read}) {
  const syncing = readSyncingAuth(read)
  return (
    <Button className={`button-size-l fa fa-${provider} ${className || ''}`}
            onClick={_.noop}
            disabled={syncing} />
  )
}

function Agreement () {
  return null && (
    <p>
      By signing up, you agree to the&nbsp;
      <a className='cursor-pointer'>Terms of Service</a>
    </p>
  )
}

function HaveNoAccount () {
  return (
    <div className='font-3'>
      Don't have an account?&nbsp;
      <Link to='auth/sign-up'>Sign up</Link>
    </div>
  )
}

function AlreadyHaveAccount () {
  return (
    <div className='font-3'>
      Already have an account?&nbsp;
      <Link to='auth/sign-in'>Sign in</Link>
    </div>
  )
}
