# Redwood

> **NOTICE:** RedwoodJS is very close to a stable version 1.0. In the last two years,
> the project has matured significantly and is already used in production by a number
> of startups. We intend to have a 1.0 release candidate before the end of 2021 and
> to release a truly production-ready 1.0 in early 2022.

This project is using the v1 release candidate (`1.0.0-rc.6` specifically). To enable this in your own Redwood application, run the following command:

```terminal
yarn redwood upgrade -t rc
```

## Outline

* [Getting Started](#getting-started)
  * [Setup](#setup)
* [Learn with Jason Instructions](#learn-with-jason-instructions)
  * [Prisma Schema](#prisma-schema)
  * [Add Database Environment Variables](#add-database-environment-variables)
  * [Apply Database Migration and Scaffold Admin Dashboard](#apply-database-migration-and-scaffold-admin-dashboard)
  * [Set up Web Side](#set-up-web-side)
  * [Add Authentication](#add-authentication)
  * [Set up Netlify Deployment](#set-up-netlify-deployment)
  * [Set up Render Deployment](#set-up-render-deployment)
  * [CORS](#cors)

## Getting Started

- [Tutorial](https://redwoodjs.com/tutorial/welcome-to-redwood): getting started and complete overview guide.
- [Docs](https://redwoodjs.com/docs/introduction): using the Redwood Router, handling assets and files, list of command-line tools, and more.
- [Redwood Community](https://community.redwoodjs.com): get help, share tips and tricks, and collaborate on everything about RedwoodJS.

### Setup

We use Yarn as our package manager. To install the dependencies and start the development server, run the following commands in the root directory:

```terminal
yarn
yarn rw dev
```

Your browser should open automatically to `http://localhost:8910` to see the web app. Lambda functions run on `http://localhost:8911` and are also proxied to `http://localhost:8910/.redwood/functions/*`.

## Learn with Jason Instructions

### Prisma Schema

Our schema has the same `Post` model used in the [Redwood tutorial](https://learn.redwoodjs.com/docs/tutorial/getting-dynamic#creating-the-database-schema).

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = "native"
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  body      String
  createdAt DateTime @default(now())
}
```

### Add Database Environment Variables

```bash
touch .env
```

Include `DATABASE_URL` in `.env`. See [this post](https://community.redwoodjs.com/t/setup-database-with-railway-cli/2025) for instructions on quickly setting up a remote database on Railway.

```
DATABASE_URL=postgresql://postgres:password@containers-us-west-10.railway.app:5513/railway
```

### Apply Database Migration and Scaffold Admin Dashboard

```bash
yarn rw prisma migrate dev --name posts
yarn rw g scaffold post
```

### Set up Web Side

Create a home page and generate a cell called `BlogPostsCell` to perform our data fetching.

```bash
yarn rw g page home /
yarn rw g cell BlogPosts
```

The query returns an array of `posts`, each of which has an `id`, `title`, `body`, and `createdAt` date.

```jsx
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const QUERY = gql`
  query POSTS {
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
  return posts.map((post) => (
    <article key={post.id}>
      <header>
        <h2>{post.title}</h2>
      </header>

      <p>{post.body}</p>
      <time>{post.createdAt}</time>
    </article>
  ))
}
```

Import the `BlogPostsCell` into `HomePage` and return a `<BlogPostsCell />` component.

```jsx
// web/src/pages/HomePage/HomePage.js

import BlogPostsCell from 'src/components/BlogPostsCell'
import { MetaTags } from '@redwoodjs/web'

const HomePage = () => {
  return (
    <>
      <MetaTags title="Home" description="This is the home page"/>

      <h1>Learn with Jason</h1>
      <BlogPostsCell />
    </>
  )
}

export default HomePage
```

### Add Authentication

```bash
yarn rw setup auth dbAuth
```

```prisma
model User {
  id                  Int @id @default(autoincrement())
  name                String?
  email               String @unique
  hashedPassword      String
  salt                String
  resetToken          String?
  resetTokenExpiresAt DateTime?
}
```

```bash
yarn rw prisma migrate dev --name users
```

```jsx
// web/src/Routes.js

import { Private, Router, Route, Set } from '@redwoodjs/router'
import PostsLayout from 'src/layouts/PostsLayout'

const Routes = () => {
  return (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Private unauthenticated="home">
        <Set wrap={PostsLayout}>
          <Route path="/posts/new" page={PostNewPostPage} name="newPost" />
          <Route path="/posts/{id:Int}/edit" page={PostEditPostPage} name="editPost" />
          <Route path="/posts/{id:Int}" page={PostPostPage} name="post" />
          <Route path="/posts" page={PostPostsPage} name="posts" />
        </Set>
      </Private>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
```

```bash
yarn rw g dbAuth
```

```jsx
// web/src/pages/HomePage/HomePage.js

import BlogPostsCell from 'src/components/BlogPostsCell'
import { MetaTags } from '@redwoodjs/web'
import { useAuth } from '@redwoodjs/auth'
import { Link, routes } from '@redwoodjs/router'

const HomePage = () => {
  const { isAuthenticated, currentUser, logOut } = useAuth()

  return (
    <>
      <MetaTags title="Home" description="This is the home page" />

      <h1>Learn with Jason</h1>
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
```

```jsx
// api/src/lib/auth.js

export const getCurrentUser = async (session) => {
  return await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true },
  })
}
```

```js
// api/src/graphql/posts.sdl.js

export const schema = gql`
  type Post {
    id: Int!
    title: String!
    body: String!
    createdAt: DateTime!
  }

  type Query {
    posts: [Post!]! @skipAuth
    post(id: Int!): Post @skipAuth
  }

  input CreatePostInput {
    title: String!
    body: String!
  }

  input UpdatePostInput {
    title: String
    body: String
  }

  type Mutation {
    createPost(input: CreatePostInput!): Post! @requireAuth
    updatePost(id: Int!, input: UpdatePostInput!): Post! @requireAuth
    deletePost(id: Int!): Post! @requireAuth
  }
`
```

```js
// api/src/functions/auth.js

const signupOptions = {
  handler: ({ username, hashedPassword, salt, userAttributes }) => {
    return false
  },
  errors: {
    fieldMissing: '${field} is required',
    usernameTaken: 'Username `${username}` already in use',
  },
}
```

### Set up Netlify Deployment

```bash
yarn rw setup deploy netlify
```

### Set up Render Deployment

```bash
yarn rw setup deploy render -d none
```

```yaml
# render.yaml

services:
- name: redwood-lwj-web
  type: web
  env: static
  buildCommand: yarn rw deploy render web
  staticPublishPath: ./web/dist
  envVars:
  - key: NODE_VERSION
    value: 16
  routes:
  - type: rewrite
    source: /.redwood/functions/*
    destination: https://redwood-lwj-api.onrender.com/*
  - type: rewrite
    source: /*
    destination: /index.html
- name: redwood-lwj-api
  type: web
  env: node
  region: oregon
  buildCommand: yarn && yarn rw build api
  startCommand: yarn rw deploy render api
  envVars:
  - key: NODE_VERSION
    value: 16
```

### CORS

```js
// api/src/functions/graphql.js

export const handler = createGraphQLHandler({
  getCurrentUser,
  loggerConfig: { logger, options: {} },
  directives,
  sdls,
  services,
  cors: {
    origin: 'https://redwood-lwj-web.onrender.com',
    credentials: 'include',
  },
  onException: () => {
    db.$disconnect()
  },
})
```

```js
// api/src/functions/auth.js

const authHandler = new DbAuthHandler(event, context, {
  db: db,
  authModelAccessor: 'user',
  authFields: {
    id: 'id',
    username: 'email',
    hashedPassword: 'hashedPassword',
    salt: 'salt',
    resetToken: 'resetToken',
    resetTokenExpiresAt: 'resetTokenExpiresAt',
  },
  cors: {
    origin: 'https://redwood-lwj-web.onrender.com',
    credentials: true,
  },
  cookie: {
    HttpOnly: true,
    Path: '/',
    SameSite: 'None',
    Secure: true,
  },
  forgotPassword: forgotPasswordOptions,
  login: loginOptions,
  resetPassword: resetPasswordOptions,
  signup: signupOptions,
})
```

```jsx
// web/src/App.js

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
      <AuthProvider
        type="dbAuth"
        config={{ fetchConfig: { credentials: 'include' } }}
      >
        <RedwoodApolloProvider
          graphQLClientConfig={{
            httpLinkConfig: { credentials: 'include' },
          }}
        >
          <Routes />
        </RedwoodApolloProvider>
      </AuthProvider>
    </RedwoodProvider>
  </FatalErrorBoundary>
)
```
