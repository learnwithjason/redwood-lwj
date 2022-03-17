export const QUERY = gql`
  query BlogPostsQuery {
    posts {
      id
      title
      body
      createdAt
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }) => (
  <div style={{ color: 'red' }}>Error: {error.message}</div>
)

export const Success = ({ posts }) => {
  return (
    <ul>
      {posts.map((item) => {
        return (
          <li key={item.id}>
            <a href={`/post/${item.id}`}>View Post</a>
            <pre>{JSON.stringify(item)}</pre>
          </li>
        )
      })}
    </ul>
  )
}
