import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'Next.js API is working!', 
    timestamp: new Date().toISOString(),
    framework: 'Next.js 15.5.0'
  })
}
