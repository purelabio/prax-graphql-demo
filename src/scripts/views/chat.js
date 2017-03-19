
export function Chats (__, {read}) {
  const channels = read('channels', 'viewer', 'allChannels', 'edges')
  return (
    <div>
      {_.map(channels, ({node: {id, name}}) => (
        <div key={id}>{name}</div>
      ))}
    </div>
  )
}
