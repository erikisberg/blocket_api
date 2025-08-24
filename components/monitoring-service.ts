import { DatabaseService, Listing } from './database'
import { smsService } from './sms-service'
import { analyzeListing } from './ai-analysis'

export interface MonitoringConfig {
  bevakningId: string
  checkIntervalMinutes: number
  minScoreForSMS: number
  maxSMSPerDay: number
  phoneNumber: string
}

export class MonitoringService {
  private config: MonitoringConfig
  private isRunning: boolean = false
  private intervalId?: NodeJS.Timeout

  constructor(config: MonitoringConfig) {
    this.config = config
  }

  // Start monitoring service
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Monitoring service is already running')
      return
    }

    console.log('🚀 Starting monitoring service...')
    this.isRunning = true

    // Run initial check
    await this.runMonitoringCycle()

    // Set up interval
    this.intervalId = setInterval(async () => {
      await this.runMonitoringCycle()
    }, this.config.checkIntervalMinutes * 60 * 1000)

    console.log(`✅ Monitoring service started. Checking every ${this.config.checkIntervalMinutes} minutes.`)
  }

  // Stop monitoring service
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    this.isRunning = false
    console.log('🛑 Monitoring service stopped')
  }

  // Update monitoring service configuration
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('⚙️ Monitoring service configuration updated:', this.config)
    
    // Restart with new configuration if running
    if (this.isRunning) {
      this.stop()
      this.start()
    }
  }

  // Main monitoring cycle
  async runMonitoringCycle(): Promise<void> {
    try {
      console.log(`\n🔄 Starting monitoring cycle at ${new Date().toISOString()}`)
      
      // Step 1: Check for new listings from Blocket
      const newListings = await this.checkForNewListings()
      console.log(`📊 Found ${newListings.length} new listings`)
      
      // Step 2: Run AI analysis on new listings
      if (newListings.length > 0) {
        await this.analyzeNewListings(newListings)
      }
      
      // Step 3: Check for high-scoring listings and send SMS
      await this.checkAndSendSMS()
      
      console.log(`✅ Monitoring cycle completed at ${new Date().toISOString()}`)
    } catch (error) {
      console.error('❌ Monitoring cycle failed:', error)
    }
  }

  // Check for new listings from Blocket API
  private async checkForNewListings(): Promise<any[]> {
    try {
      // This would integrate with your existing Blocket API
      // For now, we'll simulate finding new listings
      console.log('🔍 Checking for new listings from Blocket...')
      
      // TODO: Implement actual Blocket API call
      // const response = await fetch(`/api/blocket/bevakningar/${this.config.bevakningId}`)
      // const data = await response.json()
      
      // For now, return empty array
      return []
    } catch (error) {
      console.error('Failed to check for new listings:', error)
      return []
    }
  }

  // Analyze new listings with AI
  private async analyzeNewListings(listings: any[]): Promise<void> {
    console.log(`🤖 Running AI analysis on ${listings.length} new listings...`)
    
    for (const listing of listings) {
      try {
        // Save listing to database first
        const dbListing = await DatabaseService.upsertListing({
          bevakning_id: this.config.bevakningId,
          ad_id: listing.ad.ad_id,
          title: listing.ad.subject,
          price: listing.ad.price.value,
          currency: listing.ad.price.suffix,
          description: listing.ad.body,
          category: listing.ad.category?.[0]?.name,
          condition: listing.ad.parameter_groups?.[0]?.parameters?.[0]?.value,
          location: listing.ad.location?.[0]?.name,
          seller_type: listing.ad.advertiser.type,
          blocket_url: listing.ad.share_url,
          frontend_url: `${process.env.NEXT_PUBLIC_BASE_URL}/listing/${listing.ad.ad_id}`
        })

        // Run AI analysis
        const aiResult = await analyzeListing({
          title: listing.ad.subject,
          description: listing.ad.body,
          price: listing.ad.price.value,
          currency: listing.ad.price.suffix,
          category: listing.ad.category?.[0]?.name || 'Okänd',
          condition: listing.ad.parameter_groups?.[0]?.parameters?.[0]?.value,
          images: listing.ad.images?.map((img: any) => ({ url: img.url })),
          location: listing.ad.location?.[0]?.name || 'Okänd',
          sellerType: listing.ad.advertiser.type
        }, listing.ad.ad_id, this.config.bevakningId)

        // Update database with AI results
        await DatabaseService.updateAIAnalysis(listing.ad.ad_id, {
          score: aiResult.score,
          confidence: aiResult.confidence,
          reasoning: aiResult.reasoning,
          factors: aiResult.factors,
          recommendation: aiResult.recommendation,
          model: aiResult.model
        })

        console.log(`✅ AI analysis completed for ${listing.ad.subject}: Score ${aiResult.score}/5`)
      } catch (error) {
        console.error(`❌ Failed to analyze listing ${listing.ad.subject}:`, error)
      }
    }
  }

  // Check for high-scoring listings and send SMS
  private async checkAndSendSMS(): Promise<void> {
    try {
      console.log('📱 Checking for high-scoring listings to send SMS...')
      
      // Get user settings for category filters
      const userSettings = await DatabaseService.getUserSettings()
      const categoryFilters = userSettings?.category_filters || ['all']
      
      // Get high-scoring listings that haven't been notified about
      const highScoringListings = await DatabaseService.getHighScoringListings(
        this.config.bevakningId,
        this.config.minScoreForSMS
      )

      if (highScoringListings.length === 0) {
        console.log('📭 No high-scoring listings found for SMS notification')
        return
      }

      console.log(`💰 Found ${highScoringListings.length} high-scoring listings for SMS`)

      // Check SMS limit for today
      let smsCountToday = await DatabaseService.getSMSCountToday(this.config.phoneNumber)
      if (smsCountToday >= this.config.maxSMSPerDay) {
        console.log(`⚠️ SMS limit reached for today (${smsCountToday}/${this.config.maxSMSPerDay})`)
        return
      }

      // Filter listings by category if filters are set
      let filteredListings = highScoringListings
      if (categoryFilters.length > 0 && !categoryFilters.includes('all')) {
        filteredListings = highScoringListings.filter(listing => 
          listing.category && categoryFilters.includes(listing.category)
        )
        console.log(`📋 Filtered to ${filteredListings.length} listings in selected categories: ${categoryFilters.join(', ')}`)
      }

      // Send SMS for each high-scoring listing
      for (const listing of filteredListings) {
        if (smsCountToday >= this.config.maxSMSPerDay) {
          console.log('⚠️ SMS limit reached, stopping notifications')
          break
        }

        try {
          await this.sendSMSForListing(listing)
          smsCountToday++
        } catch (error) {
          console.error(`❌ Failed to send SMS for listing ${listing.title}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to check and send SMS:', error)
    }
  }

  // Send SMS for a specific listing
  private async sendSMSForListing(listing: Listing): Promise<void> {
    try {
      console.log(`📱 Sending SMS for listing: ${listing.title} (Score: ${listing.ai_score}/5)`)

      // Create SMS message
      const smsMessage = smsService.createHighScoreMessage({
        title: listing.title,
        price: listing.price,
        currency: listing.currency,
        ai_score: listing.ai_score!,
        ai_confidence: listing.ai_confidence!,
        blocket_url: listing.blocket_url,
        frontend_url: listing.frontend_url
      }, this.config.phoneNumber)

      // Send SMS
      const smsResult = await smsService.sendSMS(smsMessage)

      if (smsResult.success) {
        // Create SMS notification record
        await DatabaseService.createSMSNotification({
          listing_id: listing.id,
          phone_number: this.config.phoneNumber,
          message: smsMessage.message,
          status: 'sent'
        })

        // Update status with delivery ID
        if (smsResult.message_id) {
          await DatabaseService.updateSMSStatus(
            listing.id,
            'sent',
            smsResult.message_id
          )
        }

        console.log(`✅ SMS sent successfully for ${listing.title}`)
      } else {
        throw new Error(smsResult.error || 'SMS sending failed')
      }
    } catch (error) {
      console.error(`❌ Failed to send SMS for listing ${listing.title}:`, error)
      
      // Create failed SMS notification record
      await DatabaseService.createSMSNotification({
        listing_id: listing.id,
        phone_number: this.config.phoneNumber,
        message: `Failed to send SMS for ${listing.title}`,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Get monitoring status
  getStatus(): {
    isRunning: boolean
    config: MonitoringConfig
    nextCheck?: Date
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      nextCheck: this.intervalId ? new Date(Date.now() + this.config.checkIntervalMinutes * 60 * 1000) : undefined
    }
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService({
  bevakningId: '11998349',
  checkIntervalMinutes: 10,
  minScoreForSMS: 4,
  maxSMSPerDay: 20,
  phoneNumber: '+46701234567' // Default, should be configurable
})
