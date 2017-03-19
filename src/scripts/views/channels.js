import {RelativeLink} from './link'

export function Channels (__, {read}) {
  const ids = read('channels', 'ids')
  return (
    <div className='col-start-start'>
      {_.map(ids, (id) => {
        const {name} = read('channels', 'byId', id)
        return (
          <RelativeLink to={id} key={id}>
            {name}
          </RelativeLink>
        )
      })}
    </div>
  )
}
