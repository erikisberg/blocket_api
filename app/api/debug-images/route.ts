import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging images in database...')
    
    const client = await pool.connect()
    
    try {
      // Check what images we actually have
      const query = `
        SELECT 
          id,
          title,
          ad_id,
          images,
          blocket_url,
          discovered_at
        FROM listings 
        ORDER BY discovered_at DESC 
        LIMIT 10
      `
      
      const result = await client.query(query)
      const listings = result.rows
      
      // Analyze each listing's images
      const analysis = listings.map(listing => {
        const hasImages = listing.images && Array.isArray(listing.images) && listing.images.length > 0
        const imageTypes = hasImages ? listing.images.map((img: any) => {
          if (img.url.startsWith('data:image/svg+xml;base64')) return 'SVG_PLACEHOLDER'
          if (img.url.includes('via.placeholder.com')) return 'VIA_PLACEHOLDER'
          if (img.url.includes('blocket.se')) return 'BLOCHET_REAL'
          if (img.url.startsWith('http')) return 'EXTERNAL_URL'
          return 'UNKNOWN'
        }) : []
        
        return {
          id: listing.id,
          title: listing.title,
          ad_id: listing.ad_id,
          hasImages,
          imageCount: hasImages ? listing.images.length : 0,
          imageTypes,
          blocket_url: listing.blocket_url,
          discovered_at: listing.discovered_at
        }
      })
      
      console.log('📊 Image analysis completed')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Image debug completed',
        totalListings: listings.length,
        analysis
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Failed to debug images:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to debug images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
