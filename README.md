> **NOTICE**: This project has been newly refactored and is still not production ready.

# SlipStream

SlipStream was launched as a content-first social network similar to Twitter, but focused on sharing only links rather than micro-blog messages. After moonlighting the app, we're refactoring it as an open-source, self-hostable sharing tool for single users. The app will be ideal for individuals, businesses, political action groups or other entities to create simple sites and apps they can post shareable content to for their patrons, fans, members or themselves to browse and share from.

# Installtion

The app uses *NPM* for dependencies. To install, download and install *Node* from http://nodejs.org. Then do,

  cd slipstream
  npm install

It also uses *MongoDB* which requires *Homebrew* to install on Mac. See http://brew.sh. Then:

  brew install mongodb

# Run

Before running the app, environmental variables must be set. Read about them below first. To run the server, simple do,

  npm run dev

Now visit http://localhost:3400/ (port depends on `PORT` environmental variable) in your browser and you should see the main landing page.

# Set environment variables

There are a few environment variables. They need to be set in a .env file locally, and then on the Heroku environments or CodeShip, etc.

    MONGOLAB_URI // mongodb URL, including username, password and port
    S3_BUCKET_NAME // an S3 butcket for storing uploads
    S3_ACCESS_KEY_ID
    S3_SECRET_ACCESS_KEY
    S3_REGION
    IFRAMELY_URL // for getting embeds
    IFRAMELY_PORT
    SITE_NAME  // title of the site as it will appear in header/embeds
    SITE_DESCRIPTION  // description of site for SEO/embeds

#API and Documentation

## Overview

There are two parts of the application, front-end and back-end. The back-end is in Node.js and the front-end is in ReactJS.

## Routes

For a list of all API endpoints, see the file `routes/userRoute.js`.
