import { DatabaseService } from '../components/database'
import fs from 'fs'
import path from 'path'

interface ImageData {
  url: string
  description?: string
  thumbnail_url?: string
}

interface OldListing {
  ad: {
    ad_id: string
    images?: ImageData[]
  }
}

async function migrateImagesToDatabase() {
  try {
    console.log('🖼️ Starting image migration to database...')
    
    // Read the original JSON file
    const jsonPath = path.join(process.cwd(), 'bevakningar_listings.json')
    if (!fs.existsSync(jsonPath)) {
      console.error('❌ bevakningar_listings.json not found')
      return
    }
    
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    console.log(`📁 Found ${Object.keys(jsonData).length} bevakningar`)
    
    let totalImages = 0
    let migratedImages = 0
    
    // Process each bevakning
    for (const [bevakningId, listings] of Object.entries(jsonData)) {
      console.log(`\n🔍 Processing bevakning ${bevakningId} with ${(listings as any[]).length} listings`)
      
      for (const listing of listings as OldListing[]) {
        const adId = listing.ad.ad_id
        const images = listing.ad.images || []
        
        if (images.length > 0) {
          totalImages += images.length
          console.log(`  📸 Listing ${adId}: ${images.length} images`)
          
          try {
            // Update the listing with images
            await DatabaseService.updateListingImages(adId, images)
            migratedImages += images.length
            console.log(`  ✅ Updated listing ${adId} with ${images.length} images`)
          } catch (error) {
            console.error(`  ❌ Failed to update listing ${adId}:`, error)
          }
        }
      }
    }
    
    console.log(`\n🎉 Image migration completed!`)
    console.log(`   Total images found: ${totalImages}`)
    console.log(`   Successfully migrated: ${migratedImages}`)
    
  } catch (error) {
    console.error('❌ Image migration failed:', error)
  }
}

// Run the migration
migrateImagesToDatabase()
