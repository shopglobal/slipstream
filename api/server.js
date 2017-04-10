import http from 'http'
import mongoose from 'mongoose'
import express from 'express'
import config from '../src/config'
import bodyParser from 'body-parser'
import cors from 'cors'
import morgan from 'morgan'

mongoose.connect( process.env.MONGOLAB_URI )
mongoose.Promise = Promise

const app = express();

app
  .use(morgan('tiny'))
  .use(cors({
    origin: "*"
  }))
  .use(bodyParser.urlencoded( { limit: '50mb', extended: true } ) )
  .use( bodyParser.json( { limit: '50mb' } ) )
  .use('/v1', require('./routes/usersRoute.js'))

if (config.apiPort) {
  http.createServer(app).listen(config.apiPort, (err) => {
    if (err) {
      console.error(err);
    }
    console.info('----\n==> 🌎  API is running on port %s', config.apiPort);
    console.info('==> 💻  Send requests to http://%s', config.apiHost);
  });
} else {
  console.error('==>     ERROR: No PORT environment variable has been specified');
}
