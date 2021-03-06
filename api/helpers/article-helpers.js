import jsdom from 'jsdom'
import saveImage from '../helpers/save-image'

/*
Replaces external images in the body of the readbale HTML with locally-hosted images.

Accepts: article object

Returns: article object with images array and replaced URLs in article.content
*/
export default function replaceImages ( article ) {
  return new Promise( function (resolve, reject) {
    /* Try detect if the article has no images, quit if it does not. */
    if ( article.content.indexOf( 'img' ) <= -1 ) {
      return resolve( article )
    }

    /* Load a fake browser environtment to find image elements and replace them. */
    jsdom.env( article.content, {
      features: {
        ProcessExternalResources: false
      }
    }, function ( error, window ) {
      var images = window.document.getElementsByTagName( 'img' )      

      const imageMapFunction = Array.prototype.map.call(images, (each) => {
        return new Promise( function (resolve, reject) {
          saveImage(each.src)
          .then(({ hash, orig, thumb }) => {
            article.images.push({
              orig,
              hash,
              thumb
            })

            each.src = orig

            resolve()
          })
          .catch(( error ) => {
            console.log( error )
            
            const placeholderImage = "images/ss_placeholder.jpg"
            
            article.images.push({
              orig: placeholderImage,
              hash: "placeholder",
              thumb: placeholderImage
            })
            
            each.src = placeholderImage
              
            resolve()
          })
        })
      })

      Promise.all(imageMapFunction)
      .then(() => {
        article.content = window.document.body.innerHTML

        window.close()
        resolve( article )
      })
      .catch( function ( error ) {
        reject( new Error( error ) )
      })
    })
  }) // end of jsdom
}// end of replaceImages()

