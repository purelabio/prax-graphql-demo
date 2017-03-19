import {on, putIn, patchIn, test, isDict, scan, merge} from 'prax'
import {xhrGraphql} from './scaphold'

exports.defaults = {}

exports.reducers = [
  on(
    {type: 'ws/msg/subscription_data', payload: {data: {subscribeToChannel: {value: isDict}}}},
    (state, {payload: {data: {subscribeToChannel: {value}}}}) => {
      const channels = scan(state, 'channels', 'viewer', 'allChannels', 'edges')
      const indexToUpdate = _.findIndex(channels, test({node: {id: value.id}}))

      const newChannels = [
        ..._.slice(channels, 0, indexToUpdate),
        merge(_.nth(channels, indexToUpdate), {node: {...value}}),
        ..._.slice(channels, indexToUpdate + 1, _.size(channels))
      ]

      return patchIn(state, ['channels', 'viewer', 'allChannels', 'edges'], newChannels)
    }
  )
]

exports.effects = [
  on({type: 'ws/opened'}, ({ws}) => ws.sendJSON(subscribeToChannel)),

  on({type: 'ws/opened'}, env => {
    xhrGraphql(env, allChannels)
      .done(({body: {data}}) => {
        env.swap(putIn, ['channels'], data)
      })
      .start()
  })
]

exports.watchers = []

const allChannels = {
  query: `
    query allChannels ($where: ChannelWhereArgs, $orderBy: [ChannelOrderByArgs])  {
      viewer {
        allChannels (where: $where, orderBy: $orderBy) {
          edges {
            node {
              id
              name
              isPrivate
              createdAt
            }
          }
        }
      }
    }
  `,
  variables: {
    where: {
      isPrivate: {
        eq: false
      }
    },
    orderBy: {
      field: 'createdAt',
      direction: 'ASC'
    }
  }
}

const subscribeToChannel = {
  id: 0,
  type: 'subscription_start',
  query: `
    subscription subscribeToChannel ($filter: ChannelSubscriptionFilter,
      $mutations: [ChannelMutationEvent]!) {
      subscribeToChannel (filter: $filter, mutations: $mutations) {
        value {
          id
          name
          isPrivate
          createdAt
        }
      }
    }
  `,
  variables: {
    filter: {},
    mutations: ['createChannel', 'updateChannel', 'deleteChannel']
  }
}

function createChannel ({name, isPrivate}) {
  return {
    operationName: 'createChannel',
    query: `
      mutation createChannel ($channel: CreateChannelInput!) {
        createChannel (input: $channel) {
          changedChannel {
            id
            name
          }
        }
      }
    `,
    variables: {
      channel: {
        name,
        isPrivate
      }
    }
  }
}