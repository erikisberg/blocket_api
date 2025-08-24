import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    // Read the listings JSON file from the public directory
    const filePath = join(process.cwd(), 'public', 'listings.json')
    const fileContent = readFileSync(filePath, 'utf-8')
    const listings = JSON.parse(fileContent)
    
    return NextResponse.json(listings)
  } catch (error) {
    console.error('Error reading listings file:', error)
    return NextResponse.json(
      { error: 'Kunde inte läsa annonserna' },
      { status: 500 }
    )
  }
}
