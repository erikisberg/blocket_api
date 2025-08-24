import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

// Path to the listings file
const LISTINGS_FILE = path.join(process.cwd(), '..', 'bevakningar_listings.json')
const ENHANCED_LISTINGS_FILE = path.join(process.cwd(), '..', 'bevakningar_listings_enhanced.json')

// Function to enhance image quality
async function enhanceImage(imageUrl: string): Promise<{ enhanced: boolean; newUrl?: string; error?: string }> {
  try {
    console.log(`🖼️ Processing image: ${imageUrl}`)
    
    // Fetch image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }
    
    const imageBuffer = await response.arrayBuffer()
    
    // Enhance image with Sharp
    const enhancedBuffer = await sharp(Buffer.from(imageBuffer))
      .resize(800, 800, { 
        fit: 'inside', 
        withoutEnlargement: false 
      }) // Upscale to 800x800
      .sharpen(1.5, 1.0, 2.0) // Add sharpness
      .modulate({ 
        brightness: 1.1, 
        saturation: 1.1 
      }) // Improve brightness and saturation
      .png({ 
        quality: 95, 
        compressionLevel: 6 
      }) // Convert to high-quality PNG
      .toBuffer()
    
    // Save enhanced image locally
    const imageId = imageUrl.split('/').pop()?.split('?')[0] || 'unknown'
    const enhancedImagePath = path.join(process.cwd(), 'public', 'enhanced-images', `${imageId}.png`)
    
    // Ensure directory exists
    const dir = path.dirname(enhancedImagePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    // Save enhanced image
    fs.writeFileSync(enhancedImagePath, enhancedBuffer)
    
    // Create local URL for the enhanced image
    const localUrl = `/enhanced-images/${imageId}.png`
    
    console.log(`✨ Enhanced image saved: ${imageId}.png`)
    
    return { 
      enhanced: true, 
      newUrl: localUrl 
    }
    
  } catch (error) {
    console.error(`❌ Failed to enhance image ${imageUrl}:`, error)
    return { 
      enhanced: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Function to enhance all images in listings
async function enhanceAllImages() {
  try {
    console.log('🚀 Starting image enhancement process...')
    
    // Read listings file
    if (!fs.existsSync(LISTINGS_FILE)) {
      throw new Error(`Listings file not found: ${LISTINGS_FILE}`)
    }
    
    const listingsData = JSON.parse(fs.readFileSync(LISTINGS_FILE, 'utf8'))
    console.log(`📋 Found ${Object.keys(listingsData).length} bevakningar`)
    
    let totalImages = 0
    let enhancedImages = 0
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
              
              // Enhance image
              const result = await enhanceImage(image.url)
              
              if (result.enhanced && result.newUrl) {
                // Update the listing with enhanced image
                listing.ad.images[i] = {
                  ...image,
                  url: result.newUrl,
                  originalUrl: image.url, // Keep original URL for reference
                  enhanced: true,
                  enhancedAt: new Date().toISOString()
                }
                enhancedImages++
              } else {
                // Mark as failed but keep original
                listing.ad.images[i] = {
                  ...image,
                  enhanced: false,
                  error: result.error,
                  enhancedAt: new Date().toISOString()
                }
                failedImages++
              }
              
              // Add small delay to avoid overwhelming the server
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }
        }
      }
    }
    
    // Save enhanced listings
    fs.writeFileSync(ENHANCED_LISTINGS_FILE, JSON.stringify(listingsData, null, 2))
    
    console.log('\n🎉 Image enhancement completed!')
    console.log(`📊 Summary:`)
    console.log(`   Total images: ${totalImages}`)
    console.log(`   Enhanced: ${enhancedImages}`)
    console.log(`   Failed: ${failedImages}`)
    console.log(`   Success rate: ${((enhancedImages / totalImages) * 100).toFixed(1)}%`)
    console.log(`\n💾 Enhanced listings saved to: ${ENHANCED_LISTINGS_FILE}`)
    console.log(`🖼️ Enhanced images saved to: public/enhanced-images/`)
    
    // Copy to frontend public directory
    const frontendListingsFile = path.join(process.cwd(), 'public', 'listings.json')
    fs.writeFileSync(frontendListingsFile, JSON.stringify(listingsData, null, 2))
    console.log(`📁 Also saved to frontend: ${frontendListingsFile}`)
    
  } catch (error) {
    console.error('❌ Image enhancement failed:', error)
    process.exit(1)
  }
}

// Run the enhancement process
enhanceAllImages()
