var bucket = s3sig.urlSigner( process.env.PLANTER_S3_ACCESS_KEY_ID, process.env.PLANTER_S3_SECRET_ACCESS_KEY )

var image = {}

image.hash = crypto.createHash( 'md5' ).update( Math.random() + "hi" ).digest( 'hex' )

image.extension = path.extname( each.src )

image.thumb = '/read/' + image.hash + "-thumb" + image.extension

image.orig = '/read/' + image.hash + "-orig" + image.extension

image.s3UrlThumb = bucket.getUrl( 'PUT', image.thumb, process.env.PLANTER_BUCKET_NAME, 10)

image.s3UrlOrig = bucket.getUrl( 'PUT', image.orig, process.env.PLANTER_BUCKET_NAME, 10)

console.log( image.s3UrlOrig )

blitline.addJob({
	application_id: process.env.BLITLINE_APPLICATION_ID,
	src: each.src,
	functions: [
		{	name: "crop",
			params: {
				x: 0, y: 0,
				width: 400,
				height: 224
			},
			save: {
				s3_destination: {
					signed_url: image.s3UrlThumb
				},
				image_identifier: image.thumb
			}
		},
		{	name: "move_original",
			save: {
				s3_destination: {
					signed_url: image.s3UrlOrig
				},
				image_identifier: image.orig
			}
		}
	]
})

image.awsPath = "https://s3.amazonaws.com/" + process.env.PLANTER_BUCKET_NAME

each.src = image.awsPath + image.orig

article.images.push({
	image: image.awsPath + image.orig,
	imageHash: image.hash,
	imageThumb: image.awsPath + image.thumb
})

resolve( image )

blitline.postJobs( function ( response ) {
	response.results.forEach( function ( each ) {
		console.log( each.images )	
	})
})