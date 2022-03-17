import { MetaTags } from '@redwoodjs/web'
import { useAuth } from '@redwoodjs/auth'
import { Link, routes } from '@redwoodjs/router'
import BlogPostsCell from 'src/components/BlogPostsCell'

const HomePage = () => {
  const { isAuthenticated, currentUser, logOut } = useAuth()

  return (
    <>
      <MetaTags title="Home" description="Home page" />

      <h1>Learn With Jason — RedwoodJS 1.0</h1>
      {isAuthenticated ? (
        <div>
          <span>Logged in as {currentUser.email}</span>{' '}
          <button type="button" onClick={logOut}>
            Logout
          </button>
        </div>
      ) : (
        <Link to={routes.login()}>Login</Link>
      )}
      <BlogPostsCell />
    </>
  )
}

export default HomePage
