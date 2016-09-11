[ ![Codeship Status for OKNoah/slipstream](https://codeship.com/projects/e25e8050-988b-0132-afbc-261ab1ce0f66/status?branch=master)](https://codeship.com/projects/63416)

**NOTICE**: This branch is under heavy construction and the information below may be out of date.

# SlipStream

SlipStream is a content-based social network.

# Installtion

The app uses *NPM* for dependencies. To install, download and install *Node* from http://nodejs.org. Then do,

  cd slipstream
  npm install

It also uses *MongoDB* which requires *Homebrew* to install on Mac. See http://brew.sh. Then:

  brew install mongodb

# Run

Before running the app, environmental variables must be set. Read about them below first. To run the server, simple do,

  npm run dev

Now visit http://localhost:4000/ (port depends on `PORT` environmental variable) in your browser and you should see the main landing page.

# Create welcome post

There is a post that needs to be in the database before you accept user registration. Look in `./welcome_post.json` to find the command to run to create this post. Note the `_id` it is given for the next step.

# Set environment variables

There are many environment variables. They need to be set in a .env file locally, and then on the Heroku environments or CodeShip, etc. This includes `WELCOME_POST`, which is the ID of the welcome post created in the step above. Here is a partial list of variables.

  MONGOLAB_URI // mongodb URL, including username, password and port
  PLANTER_BUCKET_NAME // an S3 butcket for storing uploads
  PLANTER_S3_ACCESS_KEY_ID
  PLANTER_S3_SECRET_ACCESS_KEY
  IFRAMELY_URL
  IFRAMELY_PORT
  ALGOLIASEARCH_API_KEY
  ALGOLIASEARCH_API_KEY_SEARCH
  ALGOLIASEARCH_APPLICATION_ID
  TEST_ADMIN_TOKEN // the token of a user with admin role, used for tests
  WELCOME_POST

# Create account with admin role

Using a similar command to the one in the .json file, go to the user collection and `insert` a new user. Give the user the `role: 'admin'` field. You can leave the password blank. Then perform a password reset. Go back to the database and find the `temporary_password` field, and copy that to the `password` field. This is necessary because of the encryption of the passwords.

# Administration and beta keys

To do administration, log in with a user with the `role: 'admin'` field and got to `/#/app/admin`. From here, you can create beta keys, for exampled.

#API and Documentation

## Overview

There are two parts of the application, front-end and back-end. The back-end is in Node.js and the front-end is in ReactJS. There are several packages at use in both the front and back and you can see a list in the package.json. As mentioned, NPM is used for package managment.

## Routes

For a list of all API endpoints, see the file `routes/userRoute.js`.

### /api/authenticate

This accepts a `username` and a `password` in the body through `POST` and returns an authentication token if they are correct.

The token should be put in `window.sessionStorage.token`. The Angular app will move it to the Authentication header field when a request is made and prefix the word `Bearer`. The Node back-end will accept this token and move it to `req.token` so it can be tested against a user.

### /api/users

This returns a user's information through `GET`. All that's needed is the token, which Angular and Node should handle automatically when the token is in the session storage. It returns the email, username and join date at the time of this writing, but not password.

### /api/add

With a `POST` request, this adds a piece of content by scraping it from the web. It requires a user token, same as above, and two body fields: `type` and `url`. `Type` is the kind of content, and `url` is the web address to scrape. The types are:

`blog` - Any kind of article or web address. It scrapes 3 items: `text`, `image` (url) and `title` and saves them with the extra fiels `added` (the date added) and `user` (the owner who added it). It will later also have the original URL of the article for sharing and perhaps tags.

### /api/stream/articles

This endpoint will accept a token in the header, and returns all a user's articles, orderd by latest to earliest by default.

### /api/single/USERNAME[&id=ID][&slug=slug]

A `GET` request to this endpoint will get a single post, if it is not private. You can use the exact post slug (short, hyphonated name) or the post ID for that user. It's important to remember the post ID and the post ID _for that user_ are different. In the code, this would be the `content.users._id` field.

### /api/content/share

A `POST` request will send emails to a list of email addresses. It requires an authentication header and a body like this:

  url: String,
  title: String,
  recipients: Array

# TODOs

See our Pivotal Tracker.