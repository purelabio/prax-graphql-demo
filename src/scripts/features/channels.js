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