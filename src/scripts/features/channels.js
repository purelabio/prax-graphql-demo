import {on, putIn, scan, pipe, alter, putInBy, append, test} from 'prax'
import {ScapholdXhr} from './scaphold'
import {delIn, funnel} from '../utils'

export const channelByIdPath       = ['channels', 'byId']
export const channelIdsPath        = ['channels', 'ids']

export function preinit () {
  return {
    state: {
      channels: void {
        byId: {},
        ids: [],
      },
    },

    reducers: [
      on({
        type: 'ws/msg/subscription_data',
        payload: {data: {subscribeToChannel: {mutation: 'createChannel'}}}
      }, (state, {payload: {data: {subscribeToChannel: {edge: {node}}}}}) => (
        funnel(state, [
          alter(putIn, [...channelByIdPath, node.id], node),
          alter(putInBy, channelIdsPath, append, node.id)
        ])
      )),

      on({
        type: 'ws/msg/subscription_data',
        payload: {data: {subscribeToChannel: {mutation: 'updateChannel'}}}
      }, (state, {payload: {data: {subscribeToChannel: {edge: {node}}}}}) => (
        putIn(state, [...channelByIdPath, node.id], node)
      )),

      on({
        type: 'ws/msg/subscription_data',
        payload: {data: {subscribeToChannel: {mutation: 'deleteChannel'}}}
      }, (state, {payload: {data: {subscribeToChannel: {edge: {node}}}}}) => (
        funnel(state, [
          alter(delIn, [...channelByIdPath, node.id]),
          alter(putInBy, channelIdsPath, _.reject, test(node.id))
        ])
      )),
    ],

    effects: [
      on({type: 'ws/opened'}, ({ws}) => {
        console.info('opened ws')
        ws.sendJSON(subscribeToChannel)
      }),

      on({type: 'ws/opened'}, root => {
        ScapholdXhr(root, allChannels)
          .done(({body: {data}}) => {
            const channels = _.map(scan(data, 'viewer', 'allChannels', 'edges'), 'node')
            root.store.swap(pipe(
              alter(putIn, channelByIdPath, _.keyBy(channels, 'id')),
              alter(putIn, channelIdsPath, _.map(channels, 'id'))
            ))
          })
          .start()
      })
    ]
  }
}

const allChannels = {
  query: `
    query allChannels ($where: ChannelWhereArgs, $orderBy: [ChannelOrderByArgs])  {
      viewer {
        allChannels (where: $where, orderBy: $orderBy) {
          edges {
            node {
              ...fragmentChannel
            }
          }
        }
      }
    }

    fragment fragmentChannel on Channel {
      id
      name
      isPrivate
      createdAt
      modifiedAt
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
        mutation
        edge {
          node {
            ...fragmentChannel
          }
        }
      }
    }

    fragment fragmentChannel on Channel {
      id
      name
      isPrivate
      createdAt
      modifiedAt
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
            ...fragmentChannel
          }
        }
      }

      fragment fragmentChannel on Channel {
        id
        name
        isPrivate
        createdAt
        modifiedAt
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

