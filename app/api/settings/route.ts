import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '../../../components/database'
import { smsService } from '../../../components/sms-service'

// Get user settings
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || 'default_user'
    console.log(`🔍 Fetching settings for user: ${userId}`)
    
    const settings = await DatabaseService.getUserSettings(userId)
    
    if (!settings) {
      console.warn(`⚠️ No settings found for user: ${userId}`)
      return NextResponse.json({ 
        error: 'User settings not found',
        userId,
        suggestion: 'Settings will be created automatically on first access'
      }, { status: 404 })
    }

    console.log(`✅ Settings found for user: ${userId}`, { 
      sms_enabled: settings.sms_enabled,
      phone_number: settings.phone_number,
      min_score_threshold: settings.min_score_threshold
    })

    return NextResponse.json({ 
      success: true, 
      settings 
    })

  } catch (error) {
    console.error('❌ Failed to get user settings:', error)
    return NextResponse.json({ 
      error: 'Failed to get user settings',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Update user settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId = 'default_user', ...settings } = body

    // Validate phone number if provided
    if (settings.phone_number && !smsService.validatePhoneNumber(settings.phone_number)) {
      return NextResponse.json({ 
        error: 'Invalid phone number format. Use Swedish format: +46701234567 or 0701234567' 
      }, { status: 400 })
    }

    // Format phone number to international format
    if (settings.phone_number) {
      settings.phone_number = smsService.formatPhoneNumber(settings.phone_number)
    }

    // Validate score threshold
    if (settings.min_score_threshold && (settings.min_score_threshold < 1 || settings.min_score_threshold > 5)) {
      return NextResponse.json({ 
        error: 'Score threshold must be between 1 and 5' 
      }, { status: 400 })
    }

    // Validate notification frequency
    if (settings.notification_frequency && (settings.notification_frequency < 5 || settings.notification_frequency > 60)) {
      return NextResponse.json({ 
        error: 'Notification frequency must be between 5 and 60 minutes' 
      }, { status: 400 })
    }

    // Validate max SMS per day
    if (settings.max_sms_per_day && (settings.max_sms_per_day < 1 || settings.max_sms_per_day > 100)) {
      return NextResponse.json({ 
        error: 'Max SMS per day must be between 1 and 100' 
      }, { status: 400 })
    }

    // Validate category filters
    if (settings.category_filters && !Array.isArray(settings.category_filters)) {
      return NextResponse.json({ 
        error: 'Category filters must be an array' 
      }, { status: 400 })
    }

    // Update settings
    await DatabaseService.updateUserSettings(userId, settings)

    // Get updated settings
    const updatedSettings = await DatabaseService.getUserSettings(userId)

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully',
      settings: updatedSettings
    })

  } catch (error) {
    console.error('Failed to update user settings:', error)
    return NextResponse.json({ 
      error: 'Failed to update user settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Test SMS functionality
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, phoneNumber } = body

    if (action === 'test_sms') {
      if (!phoneNumber) {
        return NextResponse.json({ error: 'Phone number required for test SMS' }, { status: 400 })
      }

      // Validate phone number
      if (!smsService.validatePhoneNumber(phoneNumber)) {
        return NextResponse.json({ 
          error: 'Invalid phone number format' 
        }, { status: 400 })
      }

      // Format phone number
      const formattedPhone = smsService.formatPhoneNumber(phoneNumber)

      // Check if SMS API key is configured
      if (!process.env.FORTYSIXELK_API_KEY) {
        return NextResponse.json({ 
          error: 'SMS API key not configured',
          details: 'Please add FORTYSIXELK_API_KEY to your environment variables to enable SMS notifications'
        }, { status: 400 })
      }

      // Send test SMS
      const testMessage = {
        to: formattedPhone,
        from: process.env.FORTYSIXELK_SENDER || 'Blocket',
        message: `🧪 TEST SMS från Blocket AI Monitor

Detta är ett test-meddelande för att verifiera att SMS-tjänsten fungerar.

Tid: ${new Date().toLocaleString('sv-SE')}
Status: ✅ Konfigurerad och redo

Du kommer nu få SMS när undervärderade objekt hittas!`
      }

      const result = await smsService.sendSMS(testMessage)

      if (result.success) {
        if (result.message_id === 'skipped_no_api_key') {
          return NextResponse.json({ 
            error: 'SMS API key not configured',
            details: 'Please add FORTYSIXELK_API_KEY to your environment variables to enable SMS notifications'
          }, { status: 400 })
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Test SMS sent successfully',
          message_id: result.message_id
        })
      } else {
        return NextResponse.json({ 
          error: 'Failed to send test SMS',
          details: result.error
        }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Failed to test SMS:', error)
    return NextResponse.json({ 
      error: 'Failed to test SMS',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
