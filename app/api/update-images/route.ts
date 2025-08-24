import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '../../../components/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId, images } = body

    if (!listingId || !images) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing listingId or images' 
      }, { status: 400 })
    }

    console.log(`🖼️ Updating images for listing ${listingId}`)
    
    // Update images in database
    await DatabaseService.updateListingImages(listingId, images)
    
    console.log(`✅ Images updated successfully for listing ${listingId}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Images updated successfully',
      listingId,
      imageCount: images.length
    })
    
  } catch (error) {
    console.error('❌ Failed to update images:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
