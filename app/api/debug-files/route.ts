import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const cwd = process.cwd()
    const dataDir = path.join(cwd, 'data')
    
    // Check what files exist
    const files = {
      cwd,
      dataDir,
      dataDirExists: fs.existsSync(dataDir),
      rootFiles: fs.readdirSync(cwd).filter(f => !f.startsWith('.') && !f.includes('node_modules')),
      dataFiles: fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : []
    }
    
    // Try to read the specific files
    const listingsPath = path.join(cwd, 'data', 'bevakningar_listings.json')
    const statePath = path.join(cwd, 'data', 'bevakningar_state.json')
    
    const fileChecks = {
      listingsPath,
      statePath,
      listingsExists: fs.existsSync(listingsPath),
      stateExists: fs.existsSync(statePath),
      listingsSize: fs.existsSync(listingsPath) ? fs.statSync(listingsPath).size : 0,
      stateSize: fs.existsSync(statePath) ? fs.statSync(statePath).size : 0
    }
    
    return NextResponse.json({
      success: true,
      message: 'File structure debug info',
      files,
      fileChecks,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
