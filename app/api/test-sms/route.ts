import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, message } = body

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    // Test SMS via 46elk API
    const apiKey = process.env.FORTYSIXELK_API_KEY
    const sender = process.env.FORTYSIXELK_SENDER || 'ElksWelcome'

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'FORTYSIXELK_API_KEY not configured',
        details: 'Please add FORTYSIXELK_API_KEY to your Vercel environment variables'
      }, { status: 400 })
    }

    // Parse API key (format: username:password)
    const [username, password] = apiKey.split(':')
    
    if (!username || !password) {
      return NextResponse.json({ 
        error: 'Invalid API key format',
        details: 'API key should be in format: username:password'
      }, { status: 400 })
    }

    // Send SMS via 46elk
    const smsResponse = await fetch('https://api.46elks.com/a1/sms', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        from: sender,
        to: phoneNumber,
        message: message || '🧪 Test SMS från Blocket AI Monitor - SMS-tjänsten fungerar! 🚀'
      })
    })

    if (!smsResponse.ok) {
      const errorText = await smsResponse.text()
      console.error('SMS API error:', smsResponse.status, errorText)
      
      return NextResponse.json({ 
        error: 'SMS sending failed',
        status: smsResponse.status,
        details: errorText
      }, { status: 500 })
    }

    const result = await smsResponse.json()
    
    console.log('✅ SMS sent successfully:', result)

    return NextResponse.json({
      success: true,
      message: 'Test SMS sent successfully',
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ SMS test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'SMS test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET method to show current configuration
export async function GET() {
  const apiKey = process.env.FORTYSIXELK_API_KEY
  const sender = process.env.FORTYSIXELK_SENDER || 'ElksWelcome'
  
  return NextResponse.json({
    configured: !!apiKey,
    sender,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'Not set',
    instructions: [
      '1. Add FORTYSIXELK_API_KEY to Vercel environment variables',
      '2. Add FORTYSIXELK_SENDER to Vercel environment variables (optional)',
      '3. Test with POST request to this endpoint',
      '4. Check Vercel logs for detailed error messages'
    ]
  })
}
