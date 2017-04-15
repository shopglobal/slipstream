import mongoose, { Schema } from 'mongoose'

const Subscription = new Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Number,
    default: Date.now
  }
})

export default mongoose.model('Subscription', Subscription)
