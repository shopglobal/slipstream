import {Facebook} from 'fb';

const {FB_ACCESS_TOKEN, FB_APP_ID, FB_SECRET, FB_GROUP_ID} = process.env

const fb = new Facebook({
  appId: FB_APP_ID,
  appSecret: FB_SECRET,
  accessToken: FB_ACCESS_TOKEN
})

export function getEvents (req, res) {
  fb.api(`${FB_GROUP_ID}/events`, function (results) {
    if (!results || results.error) {
      console.log('error', results.error)
      return res.status(500).send('error')
    }

    res.status(200).send(results)
  });
}
