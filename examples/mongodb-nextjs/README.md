# WunderGraph MongoDB Atlas Starter

This example demonstrates how to use WunderGraph with [Next.js](https://nextjs.org/) & [MongoDB Atlas](https://www.mongodb.com/atlas/database). We are going to make your database accessible through JSON-RPC to your Next.js app.

## Getting Started


### (Optional) Create MongoDB Atlas Account

If you already have a MongoDB Atlas cluster and database setup, just grab your MongoDB URI and disgard this step. If not, please, complete the onboarding process below:

1. Sign in to MongoDB by creating an account or using your GitHub credentials
2. Create a shared cluster using any cloud provider and the default configurations
3. On the `Database Access` tab, click on `Add New Database User`. You can use any username and password you want. `admin` and `pass` is a common (__but by no means safe__) combination.
4. On the `Network Access` tab, add your current IP address or allow access from anywhere.
5. In the `Database` dashboard, click `...` and `Load Sample Dataset`. It might take several minutes to populate your database.
6. Last but not least, get your `MONGODB_URI` by clicking on `Connect` and `Connect your application`. It should look like this:
```
mongodb+srv://<USERNAME>:<PASSWORD>@cluster0.c2kvfbt.mongodb.net/<DB_NAME>?retryWrites=true&w=majority
```
7. Replace the appropriate fields with the credentials you created. For `DB_NAME` we will use the `sample_restaurants` collection. Using the setup described so far, my MongoDB URI looks like this:
```
mongodb+srv://admin:pass@cluster0.kaawy9h.mongodb.net/sample_restaurants?retryWrites=true&w=majority"
```

### Set the environment variables and start

1. Rename the file `example.env` to `.env` and replace the `MONGODB_URI` variable with your URI.

2. Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

After a while, a new browser tab will and you can start exploring the application. If no tab is open, navigate to [http://localhost:3000](http://localhost:3000).

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
