import {PraxComponent} from 'prax'
import {RelativeLink} from './link'

export class Channels extends PraxComponent {
  subrender ({read}) {
    const {env: {store}} = this
    const ids = read(store, ['channels', 'ids'])

    return (
      <div className='col-start-start'>
        {_.map(ids, (id) => {
          const {name} = read(store, ['channels', 'byId', id])
          return (
            <RelativeLink to={id} key={id}>
              {name}
            </RelativeLink>
          )
        })}
      </div>
    )
  }
}
