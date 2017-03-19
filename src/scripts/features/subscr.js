import {on} from 'prax'

exports.defaults = {}

exports.reducers = []

exports.effects = [
  on({type: 'ws/opened'}, ({ws}) => ws.sendJSON(subscribeToChannel))
]

exports.watchers = []

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
        }
      }
    }
  `,
  variables: {
    filter: {},
    mutations: ['createChannel', 'updateChannel', 'deleteChannel']
  }
}