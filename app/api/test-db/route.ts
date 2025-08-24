import { NextResponse } from 'next/server'
import { DatabaseService } from '../../../components/database'

export async function GET() {
  try {
    // Test database connection
    const settings = await DatabaseService.getUserSettings('default_user')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection working!',
      timestamp: new Date().toISOString(),
      settings: settings ? 'Found' : 'Not found',
      database: 'Connected'
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
