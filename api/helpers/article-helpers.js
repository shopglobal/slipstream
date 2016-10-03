import jsdom from 'jsdom'
import saveImage from '../helpers/save-image'
import Q from 'q'

/*
Replaces external images in the body of the readbale HTML with locally-hosted images.

Accepts: article object

Returns: article object with images array and replaced URLs in article.content
*/
export function replaceImages ( article ) {
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
          .spread(( imageHash, imageOriginalPath, imageThumbPath ) => {
            article.images.push({
              orig: imageOriginalPath,
              hash: imageHash,
              thumb: imageThumbPath
            })

            each.src = imageOriginalPath

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

      Q.all(imageMapFunction)
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

