import fs from 'fs'
import path from 'path'

// Path to the listings file
const LISTINGS_FILE = path.join(process.cwd(), '..', 'bevakningar_listings.json')
const ORIGINAL_LISTINGS_FILE = path.join(process.cwd(), '..', 'bevakningar_listings_original.json')

// Function to get original quality image URL from Blocket
function getOriginalQualityImageUrl(originalUrl: string): string {
  try {
    // Remove any existing query parameters
    let cleanUrl = originalUrl.split('?')[0]
    
    // Convert to .webp format if it's not already
    if (!cleanUrl.includes('.webp')) {
      // Extract the base path and image ID
      const urlParts = cleanUrl.split('/')
      const imageId = urlParts[urlParts.length - 1]
      
      // Remove file extension if present
      const imageIdWithoutExt = imageId.split('.')[0]
      
      // Reconstruct URL with .webp and original quality
      const basePath = urlParts.slice(0, -1).join('/')
      cleanUrl = `${basePath}/${imageIdWithoutExt}.webp`
    }
    
    // Add original quality parameter
    return `${cleanUrl}?type=original`
    
  } catch (error) {
    console.warn('Failed to enhance image URL, using original:', error)
    return originalUrl
  }
}

// Function to reload all images with original quality
async function reloadOriginalImages() {
  try {
    console.log('🚀 Starting image reload with original quality...')
    
    // Read listings file
    if (!fs.existsSync(LISTINGS_FILE)) {
      throw new Error(`Listings file not found: ${LISTINGS_FILE}`)
    }
    
    const listingsData = JSON.parse(fs.readFileSync(LISTINGS_FILE, 'utf8'))
    console.log(`📋 Found ${Object.keys(listingsData).length} bevakningar`)
    
    let totalImages = 0
    let updatedImages = 0
    let failedImages = 0
    
    // Process each bevakning
    for (const [bevakningId, listings] of Object.entries(listingsData)) {
      console.log(`\n🔍 Processing bevakning: ${bevakningId}`)
      
      if (Array.isArray(listings)) {
        for (const listing of listings) {
          if (listing.ad?.images && Array.isArray(listing.ad.images)) {
            console.log(`  📸 Processing listing: ${listing.ad.subject}`)
            
            // Process each image in the listing
            for (let i = 0; i < listing.ad.images.length; i++) {
              const image = listing.ad.images[i]
              totalImages++
              
              console.log(`    🖼️ Image ${i + 1}/${listing.ad.images.length}: ${image.url}`)
              
              // Get original quality URL
              const originalQualityUrl = getOriginalQualityImageUrl(image.url)
              
              if (originalQualityUrl !== image.url) {
                // Update the listing with original quality URL
                listing.ad.images[i] = {
                  ...image,
                  url: originalQualityUrl,
                  originalUrl: image.url, // Keep original URL for reference
                  quality: 'original',
                  updatedAt: new Date().toISOString()
                }
                updatedImages++
                console.log(`      ✨ Updated to original quality: ${originalQualityUrl}`)
              } else {
                // Mark as already original quality
                listing.ad.images[i] = {
                  ...image,
                  quality: 'original',
                  updatedAt: new Date().toISOString()
                }
                console.log(`      ✅ Already original quality`)
              }
            }
          }
        }
      }
    }
    
    // Save updated listings
    fs.writeFileSync(ORIGINAL_LISTINGS_FILE, JSON.stringify(listingsData, null, 2))
    
    console.log('\n🎉 Image reload completed!')
    console.log(`📊 Summary:`)
    console.log(`   Total images: ${totalImages}`)
    console.log(`   Updated URLs: ${updatedImages}`)
    console.log(`   Already original: ${totalImages - updatedImages}`)
    console.log(`\n💾 Updated listings saved to: ${ORIGINAL_LISTINGS_FILE}`)
    
    // Copy to frontend public directory
    const frontendListingsFile = path.join(process.cwd(), 'public', 'listings.json')
    fs.writeFileSync(frontendListingsFile, JSON.stringify(listingsData, null, 2))
    console.log(`📁 Also saved to frontend: ${frontendListingsFile}`)
    
    // Update the main listings file
    fs.writeFileSync(LISTINGS_FILE, JSON.stringify(listingsData, null, 2))
    console.log(`📁 Updated main listings file: ${LISTINGS_FILE}`)
    
  } catch (error) {
    console.error('❌ Image reload failed:', error)
    process.exit(1)
  }
}

// Run the reload process
reloadOriginalImages()
