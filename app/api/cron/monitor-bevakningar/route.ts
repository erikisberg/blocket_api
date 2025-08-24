import { NextRequest, NextResponse } from 'next/server'
import { monitoringService } from '../../../../components/monitoring-service'
import { DatabaseService } from '../../../../components/database'

// Vercel cron job endpoint
// This will be called every 10 minutes by Vercel
export async function GET(request: NextRequest) {
  try {
    console.log('🕐 Cron job triggered for bevakningar monitoring')
    
    // Verify cron secret if needed
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user settings
    const userSettings = await DatabaseService.getUserSettings()
    if (!userSettings) {
      throw new Error('User settings not found')
    }

    // Update monitoring service config
    monitoringService.updateConfig({
      bevakningId: '11998349', // Your existing bevakning
      checkIntervalMinutes: userSettings.notification_frequency,
      minScoreForSMS: userSettings.min_score_threshold,
      maxSMSPerDay: userSettings.max_sms_per_day,
      phoneNumber: userSettings.phone_number
    })

    // Run monitoring cycle
    await monitoringService.runMonitoringCycle()

    return NextResponse.json({ 
      success: true, 
      message: 'Monitoring cycle completed',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Cron job failed:', error)
    return NextResponse.json({ 
      error: 'Monitoring cycle failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Manual trigger endpoint for testing
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Manual monitoring trigger')
    
    const body = await request.json()
    const { action, config } = body

    switch (action) {
      case 'start':
        await monitoringService.start()
        return NextResponse.json({ success: true, message: 'Monitoring service started' })
      
      case 'stop':
        monitoringService.stop()
        return NextResponse.json({ success: true, message: 'Monitoring service stopped' })
      
      case 'run_once':
        console.log('🚀 Running single monitoring cycle...')
        await monitoringService.runMonitoringCycle()
        
        // Also send daily summary if it's a new day
        try {
          const dailySummaryResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/daily-summary`, {
            method: 'POST'
          })
          if (dailySummaryResponse.ok) {
            console.log('📊 Daily summary sent successfully')
          }
        } catch (summaryError) {
          console.warn('⚠️ Daily summary failed:', summaryError)
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Single monitoring cycle completed with daily summary' 
        })
      
      case 'status':
        return NextResponse.json({ 
          success: true, 
          status: monitoringService.getStatus() 
        })
      
      case 'update_config':
        if (config) {
          monitoringService.updateConfig(config)
          return NextResponse.json({ success: true, message: 'Config updated' })
        }
        return NextResponse.json({ error: 'Config required' }, { status: 400 })
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Manual trigger failed:', error)
    return NextResponse.json({ 
      error: 'Manual trigger failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
