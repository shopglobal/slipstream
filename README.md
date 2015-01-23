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

To run the server, simple do,

	node server.js

Now visit http://localhost:4000/ in your browser and you should see the main landing page.

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

Here's a list of little TODOs. Big ones go on Blossom.

* Add tabs for "article", "video" and "audio" to menu bar.

* Change API to accept `POST` and `GET` on streams for adding. Basically clean up API enpoint syntax.

Some nice-to-haves:

* Collect formatting of articles to have read-it-later type functionlity instead of just preview.

* Link to read-it-later or Readablity like service for each article.

# Version names

Here are the planned version names. They are the names of muted colours going couter-clockwise around the colour circle, starting near our mock-up colour, green, with moss. List:

Moss -- 0.1.0
Lime
Mint
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
