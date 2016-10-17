import mongoose from 'mongoose'
import slugs from 'mongoose-url-slugs'

const ContentSchema = new mongoose.Schema({
  title: String,    // title of the item
  url: String,    // direc link the non-embed browser version of
  service: String,  // such as youtube
  author: String,   // who made it on the parent site (eg youtube)
  description: String,  // description of content
  text: String,     // full text of content
  date: String,   // date of post on parent site (youtube, etc)
  images: Array,
  thumbnail: Number,
  views: Number,    // number of views on the parent site
  duration: Number, // how long it is
  likes: Number,    // number of lives on parent site
  dislikes: Number,   // number of dislikes on parent site
  shares: Number,   // number of times share on social media/email
  processing: Boolean, // whether the item is still being loaded in the background
  stream: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  flags: {
    adult: {
      type: Boolean,
      default: false
    },
    hidden: {
      type: Boolean,
      default: false
    }
  }
})

ContentSchema.methods.flagHidden = () => {
  this.flags.hidden = true

  return this.save()
}

ContentSchema.plugin( slugs( 'title', { field: 'slug' } ) )

export default mongoose.model( 'Content', ContentSchema )
