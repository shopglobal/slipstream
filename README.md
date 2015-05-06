[ ![Codeship Status for OKNoah/slipstream](https://codeship.com/projects/e25e8050-988b-0132-afbc-261ab1ce0f66/status?branch=master)](https://codeship.com/projects/63416)

# SlipStream

SlipStream is a content-based social network.

# Installtion

The app uses *Bower* and *NPM* for dependencies. To install, download and install *Node* from http://nodejs.org. Then do,

	cd slipstream
	npm install -g bower
	npm install
	bower install

It also uses *MongoDB* which requires *Homebrew* to install on Mac. See http://brew.sh. Then:

	brew install mongodb

# Run

Before running the app, environmental variables must be set. Read about them below first. To run the server, simple do,

	foreman start web

Now visit http://localhost:4000/ (port depends on `PORT` environmental variable) in your browser and you should see the main landing page.

# Create welcome post

There is a post that needs to be in the database before you accept user registration. Look in `./welcome_post.json` to find the command to run to create this post. Note the `_id` it is given for the next step.

# Set environment variables

There are many environment variables. They need to be set in a .env file locally, and then on the Heroku environments or CodeShip, etc. This includes `WELCOME_POST`, which is the ID of the welcome post created in the step above. Here is a partial list of variables.

	WEB // the command to start the server, eg. `nodemon --exec node-theseus server.js`
	MONGOLAB_URI // mongodb URL, including username, password and port
	PORT
	PLANTER_BUCKET_NAME // an S3 butcket for storing uploads
	PLANTER_S3_ACCESS_KEY_ID
	PLANTER_S3_SECRET_ACCESS_KEY
	IFRAMELY_URL
	IFRAMELY_PORT
	ALGOLIASEARCH_API_KEY
	ALGOLIASEARCH_API_KEY_SEARCH
	ALGOLIASEARCH_APPLICATION_ID
	PUBLIC_FOLDER // either build or public depending on environment
	NEW_RELIC_LICENSE_KEY
	TEST_ADMIN_TOKEN // the token of a user with admin role, used for tests
	WELCOME_POST

# Create account with admin role

Using a similar command to the one in the .json file, go to the user collection and `insert` a new user. Give the user the `role: 'admin'` field. You can leave the password blank. Then perform a password reset. Go back to the database and find the `temporary_password` field, and copy that to the `password` field. This is necessary because of the encryption of the passwords.

# Administration and beta keys

To do administration, log in with a user with the `role: 'admin'` field and got to `/#/app/admin`. From here, you can create beta keys, for exampled.

#API and Documentation

## Overview

There are two parts of the application, front-end and back-end. The back-end is in Node.js and the front-end is in Angular JS. There are several packages at use in both the front and back and you can see a list in the package.json and bower.json files. As mentioned, Bower and NPM are used for package managment. The front-end files are in the `/public` folder and the Bower-installed packages are in `public/vendor`.

Node.js serves both the JSON API and the static web files. The app to launch both is `server.js`. The endpoint for the API is `/api` and the endpoint for the static web app is just `/`. Here are the other API details. They are subjec to change so please contact me if there's any inconsistencies.

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

# TODOs

See our Pivotal Tracker.

# Version names

Here are the planned version names. They are the names of muted colours going couter-clockwise around the colour circle, starting near our mock-up colour, green, with moss. List:

Moss -- 0.1.0

Lime -- 0.2.0

Mint -- 0.3.0

Seaglass

Robin’s Egg

Peacock

Sky Grey

Sky Blue

Lavender

Velvet

Heliotrope

Old Rose

Pink

Coral

Dusty Plum

Dune

Marigold

Parchment

Canary
