import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bevakningId, listingId, analysis } = body

    if (!bevakningId || !listingId || !analysis) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Read the current listings file (frontend)
    const frontendFilePath = join(process.cwd(), 'public', 'listings.json')
    const frontendFileContent = readFileSync(frontendFilePath, 'utf-8')
    const frontendListings = JSON.parse(frontendFileContent)

    // Read the main listings file (root)
    const mainFilePath = join(process.cwd(), '..', 'bevakningar_listings.json')
    const mainFileContent = readFileSync(mainFilePath, 'utf-8')
    const mainListings = JSON.parse(mainFileContent)

    // Find and update the specific listing in both files
    if (frontendListings[bevakningId] && mainListings[bevakningId]) {
      const frontendListingIndex = frontendListings[bevakningId].findIndex(
        (listing: any) => listing.ad.ad_id === listingId
      )
      
      const mainListingIndex = mainListings[bevakningId].findIndex(
        (listing: any) => listing.ad.ad_id === listingId
      )
      
      if (frontendListingIndex !== -1 && mainListingIndex !== -1) {
        // Add AI analysis to both listings
        frontendListings[bevakningId][frontendListingIndex].ai_analysis = analysis
        mainListings[bevakningId][mainListingIndex].ai_analysis = analysis
        
        // Save both files
        writeFileSync(frontendFilePath, JSON.stringify(frontendListings, null, 2), 'utf-8')
        writeFileSync(mainFilePath, JSON.stringify(mainListings, null, 2), 'utf-8')
        
        console.log(`✅ AI analysis saved for listing ${listingId} in both files`)
        
        return NextResponse.json({ 
          success: true, 
          message: 'Analysis saved successfully to both files' 
        })
      } else {
        return NextResponse.json(
          { error: 'Listing not found in one or both files' },
          { status: 404 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Bevakning not found in one or both files' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error saving analysis:', error)
    return NextResponse.json(
      { error: 'Failed to save analysis' },
      { status: 500 }
    )
  }
}
