# Building a Twitter clone with WunderGraph

## Introduction

This tutorial will guide you through the process of building a functional replica of Twitter, utilizing WunderGraph, React, MongoDB, and Auth0.

Upon completion, not only will you have a functioning replica of Twitter, but you will also have gained a comprehensive understanding of the capabilities and potential of WunderGraph..

This project was prepared by two developers from our awesome community! Thank you again!

Here is what the finished product will look like:

![Twitter Image](/images/twitter_guide/twitter-clone.gif)

## Contents

- [Twitter Skelton](#twitter-init)
- [WunderGraph Setup](#wundergraph-init)
- [MongoDB Setup](#mongodb-init)
- [Configuring WunderGraph Operations](#configuring-wundergraph-operations)
- [Implementing WunderGraph Operations into Twitter-Clone](#implementing-wundergraph-operations-into-twitter-clone)
- [Auth0 Setup](#auth0-init)
- [Configuring WunderGraph with Auth0](#configuring-wundergraph-with-auth0)
- [Implementing WunderGraph Auth0 into Twitter-Clone](#implementing-wundergraph-auth0-into-twitter-clone)
- [Final Working Version](#final-working-version)

## Prerequisites

We’ll assume that you have some familiarity with HTML and JavaScript, as well with the popular framework React, but you should be able to follow along even if you are a beginner. We’ll also assume that you’re familiar with programming concepts like functions, objects, arrays, and to a lesser extent, classes.

We'll also assume you have heard of or worked with MongoDB, [Auth0](https://auth0.com/) and [WunderGraph](https://wundergraph.com/) 😉

## Basic Twitter Setup

To focus more on the power of WunderGraph, we've taken care of the styling for you. Please keep in mind this is a very basic twitter clone for educational purposes!

Open up your terminal and clone the community repo using:

```bash
git clone https://github.com/Sawmonabo/wundergraph-twitter-clone.git
```

Once you clone the repo you're going to want to download the current dependencies and start the application. Enter the following into your terminal:

```bash
npm i && npm start
```

As you can see this will load up the skeleton structure of our Twitter-Clone.

Before moving forward, lets take a look at **Feed.js** file located within our **src** folder.

In the code snippet below, we are creating a const named **tweets** where we are currently assigning hard-coded values to it and inserting it onto our twitter feed.

Feel free to add another hard coded tweet if you want. This will be dynamic once we get our DB set up.

```javascript
// Feed.js

const tweets = [
  {
    displayName: 'Test User',
    username: 'testuser',
    verified: true,
    text: 'This is the first tweet!',
    avatar: null,
    image: null,
  },
]
```

Next, Let's navigate to **TweetBox.js** file, also within the **src** folder, is where users will be creating/sending their tweets. Once again, we are currently assigning hard-coded values to our user attributes.

```javascript
// TweetBox.js

const user = {
  avatarUrl: '',
  email: 'testuser@test.com',
  firstName: 'Test',
  lastName: 'User',
  name: 'Test User',
}
```

and then capturing the input message or image url from the front-end to our `sendTweet` const that acts as our onClick method.

```javascript
// TweetBox.js

const sendTweet = (e) => {
  e.preventDefault()

  if (tweetMessage) {
    console.log(`Sending tweet with message: ${tweetMessage}`)
    console.log(`Sending tweet with image: ${tweetImage}`)
  }

  setTweetMessage('')
  setTweetImage('')
}
```

While the application is still running on `localhost:3000`, go ahead and open up the Chrome dev tools console.

If you type in a message and click Tweet you'll be able to see the console log our input to the TweetBox upon clicking the tweet button.

## Setting up WunderGraph

Now that we have setup our skeleton structure for our Twitter-Clone, let's move on to adding WunderGraph to our application to help simpilify our lives.

Open up your terminal and type the following command:

```bash
npx create-wundergraph-app twitter-clone -E simple
```

**We apologize for this hassle right here. This will be automated in the future**

Now we need to move our **.wundergraph folder**, **tsconfig.json**, and our **.gitignore** all from the generated twitter-clone folder to our root dierctory of our project `/`

Next, let's install our WunderGraph dependencies using the following commands

```bash
npm i @wundergraph/sdk
npm i @wundergraph/swr
npm i graphql
npm i typescript --save-dev
```

Add the following two entries to your package.json

```json
"wundergraph": "wunderctl up --debug",
"generate": "wunderctl generate up --debug"
```

After completeing these steps we can remove the generated twitter-clone folder.

```bash
rm -r twitter-clone
```

Last, we want to update our file `wundergraph.config.ts` located in the **.wundergraph folder**

_From:_

```typescript
allowedOrigins:
	process.env.NODE_ENV === 'production'
		? [
			// change this before deploying to production to the actual domain where you're deploying your app
			'http://localhost:3000',
			]
		: ['http://localhost:3000', new EnvironmentVariable('WG_ALLOWED_ORIGIN')],
```

_To:_

```typescript
allowedOrigins:
	process.env.NODE_ENV === 'production'
		? [
				// change this before deploying to production to the actual domain where you're deploying your app
				'http://localhost:3000',
		  ]
		: ['http://localhost:3000'],
```

## MongoDB SetUp

WunderGraph supports multiple databases. For this demo, we will be using MongoDb.

Geting started with the MongoDB is super easy.

First start by creating an account or signing in with your existing account on [MongoDB Atlas](https://account.mongodb.com/account/login?nds=true&_ga=2.53799790.754773367.1672107021-1055546340.1672107021&_gac=1.45787478.1672107021.CjwKCAiAqaWdBhAvEiwAGAQltm3pdx2laKih-31DCbQo-U6e_PJ8aizwcctAqawCcZgH9pTUSjGnVRoCKi8QAvD_BwE)

After creating or signing into your acount, perform the following steps:

1. Choose or create an organization, then click **New Project**, give it a name, then click **Create Project**

2. Click **Add Current IP Address**

3. Then click **Build a Database**

   - Choose Shared Free tier
   - Allow default settings for the Cluster
   - Click "Connect Cluser" at the bottom

Next, you will be taken to the Securty QuickStart screen:

4. Choose a username and password for the database, **SAVE THESE**
5. Choose **My Local Enviroment** from where you want to comment from and click the "Add My Current IP Address" (Make sure it says that your IP Address has been added, this is very important!)
6. Click the **Finish and Close** button
7. Choose **Connect using VSCode** and copy/save the connection string in the ( Connect to your MongoDB deployment ) text box.
   - **ex: mongodb+srv://user:<password>@cluster0.jzgqp26.mongodb.net/test**

### Adding Sample Data

Once you create your Database, Let's create a sample document for your twitter feed to represent an existing tweet

1. Click the **Browse Collections** button
2. Next, Click the **Add My Own Data** button.
3. Create a Database with the name **Twitter** and a collection name of **Tweets**.
4. Click the **INSERT DOCUMENT** button on the right hand side to insert our existing tweet.
5. Click the JSON icon and add the following document:

```json
{
  "_id": { "$oid": "63816aaad38a36c5cfddaf06" },
  "displayName": "Test User",
  "username": "testuser",
  "verified": true,
  "text": "I love Wundergraph",
  "avatar": "https://images-ext-1.discordapp.net/external/FrhETDKgDLfwckbcNUU9Ap3gkzIIU9a6mYuFa69SXlA/https/www.shareicon.net/data/512x512/2016/09/15/829459_man_512x512.png",
  "date": { "$date": { "$numberLong": "1671955200000" } },
  "image": "https://avatars.githubusercontent.com/u/64281914?s=200&v=4"
}
```

That's it for setting up MongoDB!

### Introspecting MongoDB with WunderGraph

Hop back over to your code and let's configure your MongoDB cluster with WunderGraph

Inside the **.wundergraph folder**, open the **wundergraph.config.ts** file

Comment out or delete the countries datasource and add the following datasource:

```typescript
const tweets = introspect.mongodb({
  apiNamespace: 'tweets',
  databaseURL:
    'mongodb+srv://user:pass@cluster0.uvkwxgc.mongodb.net/TweetsCollection',
  introspection: {
    pollingIntervalSeconds: 5,
  },
})
```

Now update your apis array in your config to include your new MongoDB Datasource:

```typescript
configureWunderGraphApplication({
	apis: [
		tweets
	],
```

After updating your WunderGraph Config, run the following command to initialize the setup.

```bash
wunderctl generate
```

Next we want to have WunderGraph introspect our database scheme and generate some operations for our database. Before running the command below be sure to update the mongo cluster address to the one we copied from [MongoDB Atlas](https://account.mongodb.com/account/login?nds=true&_ga=2.53799790.754773367.1672107021-1055546340.1672107021&_gac=1.45787478.1672107021.CjwKCAiAqaWdBhAvEiwAGAQltm3pdx2laKih-31DCbQo-U6e_PJ8aizwcctAqawCcZgH9pTUSjGnVRoCKi8QAvD_BwE).

```bash
wunderctl introspect mongodb mongodb+srv://<your-username>:<your-password>@cluster0.uvkwxgc.mongodb.net/<your-database-name>
```

Note: make sure to replace the `uvkwxgc` with your own cluster address

After introspecting, let's create your prisma schema.

in the **root** directory create a file named `schema.prisma`.

Add the following to your prisma file. This file will tell Prisma the datatypes for your MongoDb Document properties:

```graphql
datasource db {
		provider = "mongodb"
		url      = "mongodb+srv://<your-username>:<your-password>@cluster0.<your-cluster-hash>.mongodb.net/<your-database-name>"
	}

model Tweets {
	id          String   @id @default(auto()) @map("_id") @db.ObjectId
	displayName String
	username    String
	verified    Boolean
	text        String
	avatar      String?
	image       String?
	date        DateTime @default(now())
}
```

## Configuring WunderGraph Operations

Within our **src** directory, Create a folder named **lib**. Once added, create a file inside of **lib** called **wundergraph.ts**. Within the **wundergraph.ts** file add the following contents:

```typescript
import { createClient, Operations } from '../components/generated/client'

import { createHooks } from '@wundergraph/swr'

const client = createClient() // Typesafe WunderGraph client

export const {
  useQuery,
  useMutation,
  useSubscription,
  useUser,
  useFileUpload,
  useAuth,
} = createHooks<Operations>(client)
```

If we take a look at the **jsonchema.ts** file in **src/components/generated** and look for the **findManytweets** query and **createOnetweets** mutation, that will be the two we use in our manually defined operation.

Let's define our operations using WunderGraph

Open up the directory **.wundergraph/operations** in the root directory. Create a new file called **GetTweets.graphql** and add the following code:

```graphql
query GetTweets {
  tweets_findManytweets {
    id
    displayName
    username
    verified
    text
    avatar
    image
    date
  }
}
```

This is a simple operation to query tweets.

Let's add another operation. Create another filed called **AddTweet.graphql** and add the following:

```graphql
mutation AddTweet($data: tweets_tweetsCreateInput!) {
  tweets_createOnetweets(data: $data) {
    id
    displayName
    username
    verified
    text
    avatar
    image
    date
  }
}
```

This code is a simple mutation that will allow us to add tweets to our twitter clone.

Now that our operations are done. Run the following command to initalize your functions with WunderGraph.

```bash
wunderctl generate
```

## Implementing WunderGraph Operations into Twitter-Clone

Now that have created our operations we can use WunderGraphs built in react hooks to fetch the data onto our frontend. Let's add our calls to the **useQuery/useMutation** hooks. Fetching our operations via hooks will allows us to retrieve live data data and create tweets and store them with our Mongo database.

Switch over to **Feed.js** in our **src** folder and update `const tweets` to the following:

```javascript
const tweets = useQuery({
  operationName: 'GetTweets',
  liveQuery: true,
  requiresAuthentication: false,
})
```

Next within **Feed.js** update the line within our tag that calls .map() to the following:

```javascript
{
  tweets.data?.tweets_findManytweets?.map((tweet) => (
    <Post
      displayName={tweet.displayName}
      username={tweet.username}
      verified={tweet.verified}
      text={tweet.text}
      avatar={tweet.avatar}
      image={tweet.image}
      key={tweet.id}
    />
  ))
}
```

Within the same directory, navigate over to **TweetBox.js** and add the following mutation operatons.

```javascript
// add import:
import { useMutation } from './lib/wundergraph'

const { trigger } = useMutation({
  operationName: 'AddTweet',
  requiresAuthentication: true,
})

const sendTweet = (e) => {
  e.preventDefault()

  if (tweetMessage) {
    trigger({
      data: {
        displayName: user.firstName,
        username: user.firstName + '_' + user.lastName,
        verified: true,
        text: tweetMessage,
        avatar: user.avatarUrl,
        image: tweetImage,
        date: new Date(),
      },
    })
  }

  setTweetMessage('')
  setTweetImage('')
}
```

Finally, within your **root** directory. Create an `.env` file and add the follow:

```
GENERATE_SOURCEMAP=false
```

let's check the results of our twitter feed now. Running the following command in your terminal:

```bash
wunderctl up --debug
```

and once it's running, open a second terminal window and run the following:

```bash
npm start
```

You should now see our twitter feed now includes our tweet document we created within our MongoDB database previously. You should now also be able to create a tweet and see it automatically upload into our twitter feed and MongoDB. How cool!

## TODO: what we just did and how much time it saved us section

## Adding Authentication with Auth0

With WunderGraph, you can use any Authentication provider Such as Ory, Keycloak, Auth0, OpenID Connect, and more. For this demo, we will be using our Partner Auth0.

Start by creating an [Auth0](https://auth0.auth0.com/u/login/identifier?state=hKFo2SBQZ3RaREhZTFNkbU1VQ250Z054UGItVmVVeTNOZWpmZKFur3VuaXZlcnNhbC1sb2dpbqN0aWTZIDZfaVlSRFMwNXo5b0w3aXhLVUlGOTE2QkNtaVZUeFV4o2NpZNkgYkxSOVQ1YXI2bkZ0RE80ekVyR1hkb3FNQ000aU5aU1Y) account or signing in if you already have an account.

Once you create an account or sign in, perform the following steps.

1. Log in to Auth0 dashboard.

2. Click the Applications link in the left navigation pane.

3. Click the + Create Application button.

4. Fill out the Application fields:​

- Enter a name in the Name field to help you identify this client. We recommend combing "WunderGraph" with your client's name. For example: `WunderGraph-my_app​`
- For application type, select Regular Web Applications
- Click the Create button.

![Auth0 Image 1](/images/twitter_guide/Auth0-Step-1.jpg)

Click the Settings tab. ​At this point, this is all the configuration we need for Auth0 client. To configure our client with our WunderGraph application, we will need three pieces of information.​

- The Domain (AKA The issuer)
- Client ID
- Client Secret

![Auth0 Image 2](/images/twitter_guide/Auth0-Step-2.jpg)

Open up your **.env** file and paste in the following with your information:

```
AUTH0_ISSUER=<Issuer>
AUTH0_CLIENT_ID=<Client ID>
AUTH0_CLIENT_SECRET=<Client Secrect>
```

- Note: Issuer should start with `https://`

Final step, scroll down in the auth0 settings and set your callback URL to: **http://localhost:9991/auth/cookie/callback/auth0**

![Auth0 Image 3](/images/twitter_guide/Auth0-Step-3.jpg)

## Configuring Auth0 with WunderGraph

Now that we finished with our Auth0 config, let's configure it into our WunderGraph application.

Navigate over to the **wundergraph.config.ts** file located in the **.wundergraph** folder and add the following:

```typescript
 authentication: {
 	cookieBased: {
 	providers: [
 	authProviders.openIdConnect({
 		id: 'auth0',
 		issuer: new EnvironmentVariable('AUTH0_ISSUER'),
 		clientId: new EnvironmentVariable('AUTH0_CLIENT_ID'),
 		clientSecret: new EnvironmentVariable('AUTH0_CLIENT_SECRET')
 	})
 			],
 	 authorizedRedirectUris: ['http://localhost:3000/', 'http://127.0.0.1:3000/'],
 	},
 },
```

"We can now utilize Auth0 for authentication in WunderGraph. Let's complete the tutorial and integrate it into our Twitter-Clone.

## Implementing Authentication into our Twitter Clone

Within your .**src** directory, create a new folder called **auth0_components**.

Create six new files inside the **auth0_components** folder:

- `LoginButton.js`
- ` LoginButton.css`

- `LogoutButton.js`
- ` LogoutButton.css`

- `Auth.js`
- ` Auth.css`

Add the following code to your files:

### LoginButton.js

Here we are creating our **Login** and **Logout** buttons and using Auth0 as our authentication provider.

```javascript
// LoginButton.js

import React from 'react'
import { useAuth } from '../lib/wundergraph'
import { Button } from '@mui/material'
import './LoginButton.css'

const LoginButton = () => {
  const { login } = useAuth()

  return (
    <Button
      className="login-button-container"
      onClick={() => {
        login('auth0')
      }}
    >
      Continue
    </Button>
  )
}

export default LoginButton
```

### LoginButton.css

```javascript
// LoginButton.css

.login-button-container {
	flex: 2;
	background-color: var(--twitter-color) !important;
	border: none !important;
	/* color: white !important; */
	color: rgb(34, 34, 34) !important;
	font-weight: 500 !important;
	text-transform: inherit !important;
	border-radius: 5px !important;
	height: 25px !important;
	text-align: center;
	justify-content: center;
	align-items: center;
	margin-right: 20px !important;
	margin-left: auto !important;
}
```

### LogoutButton.js

```javascript
// LogoutButton.js

import React from 'react'
import { useAuth } from '../lib/wundergraph'
import { Button } from '@mui/material'
import './LogoutButton.css'

const LogoutButton = () => {
  const { logout } = useAuth()

  return (
    <Button
      onClick={() => {
        logout({ logoutOpenidConnectProvider: true })
      }}
      variant="contained"
      className="logout_button"
      fullWidth
    >
      Sign Out
    </Button>
  )
}

export default LogoutButton
```

### LogoutButton.css

```javascript
// LogoutButton.css

.logout_button {
		background-color: var(--twitter-color) !important;
		border: none !important;
		color: white !important;
		font-weight: 700 !important;
		text-transform: inherit !important;
		border-radius: 20px !important;
		height: 50px !important;
		margin-top: 20px !important;
}
```

### Auth.js

```javascript
// Auth.js

import React from 'react'
import LoginButton from './LoginButton'
import './Auth.css'

function Auth() {
  return (
    <div className="Auth-form-container">
      <div className="Auth-form">
        <div className="Auth-form-content">
          <h1 className="Auth-form-title">Twitter-Clone</h1>
          <h4 className="Auth-form-sub-title">Sign-in w/Auth0</h4>
          <div className="button-container">
            <LoginButton />
          </div>
        </div>
      </div>
    </div>
  )
}
export default Auth
```

### Auth.css

```javascript
// Auth.css

.Auth-form-container {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100vw;
	height: 100vh;
}

.Auth-form {
	width: 420px;
	box-shadow: rgb(0 0 0 / 16%) 1px 1px 10px;
	padding-top: 30px;
	padding-bottom: 20px;
	border-radius: 8px;
	background-color: white;
}

.Auth-form-content {
	padding-left: 12%;
	padding-right: 12%;
}

.Auth-form-title {
	text-align: center;
	/* margin-bottom: 1em; */
	padding-bottom: 15px;
	font-size: 30px;
	color: var(--twitter-color);
	font-weight: 800;
}

.Auth-form-sub-title {
	text-align: center;
	font-size: 15px;
	font-weight: 600;
	color: rgb(34, 34, 34);
	margin-bottom: 1em;
}

.button-container {
	padding-left: 40%;
	padding-right: 20%;
}
```

Almost there! After creating our Auth0 components, we need to update our **App.js** within our **src** directory to configure Auth0 login/logout.

We can now also capture the user attributes from Auth0 using our WunderGraph hooks with **useUser()**.

Update you **App.js** file to look like this:

```javascript
// App.js

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUser } from './lib/wundergraph'
import React from 'react'
import Home from './Home'
import Auth from './auth0_components/Auth'
import './App.css'

const queryClient = new QueryClient()

function App() {
  const user = useUser()

  if (user.data) {
    return (
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    )
  } else {
    return (
      <QueryClientProvider client={queryClient}>
        <Auth />
      </QueryClientProvider>
    )
  }
}
export default App
```

Next, we should include the Logout Button in the Sidebar view so that we can log out cleanly.

Open up the **Sidebar.js** file and add the following:

```javascript
import React from 'react';
...
import LogoutButton from './auth0_components/LogoutButton';
import './Sidebar.css';
...
		<SidebarOption Icon={MoreHorizIcon} text='More' />
		<LogoutButton />
```

Our final step is to switch over the **TweetBox.js** file inside our **src** directory and updated our hard-coded user information to use user information from our generated cookie upon login.

Add the following code:

```javascript
// add to our existing import useUser:
import { useUser, useMutation } from './lib/wundergraph'

// replace the const user with:
const user = useUser().data
```

with that in place. We've finished our Twitter-Clone!

## Deploying our app to WunderGraph Cloud ..?

## Conclusion

So let's go over what we just built
