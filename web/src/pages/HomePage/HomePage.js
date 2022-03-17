import { MetaTags } from '@redwoodjs/web'
import BlogPostsCell from 'src/components/BlogPostsCell'

const HomePage = () => {
  return (
    <>
      <MetaTags title="Home" description="Home page" />

      <h1>HomePage</h1>
      <BlogPostsCell />
    </>
  )
}

export default HomePage
