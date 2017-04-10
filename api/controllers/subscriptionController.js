import Subscription from '../models/subscriptionModel'

export function postSubscription (req, res) {
  const { deviceId } = req.body

  const sub = new Subscription({
    deviceId
  })

  sub.save()
  .then(() => {
    res.status(200).send({ data: {
      message: 'Device added: ' + deviceId
    }})
  })
  .catch((error) => {
    res.status(500).send({ data: {
      error
    }})
  })
}
