// SMS service using 46elk API
export interface SMSMessage {
  to: string
  from: string
  message: string
}

export interface SMSResponse {
  success: boolean
  message_id?: string
  error?: string
}

export class SMSService {
  private apiKey: string
  private sender: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.FORTYSIXELK_API_KEY || ''
    this.sender = process.env.FORTYSIXELK_SENDER || 'BlocketAlert'
    this.baseUrl = 'https://api.46elk.com/v1'
  }

  // Send SMS via 46elk
  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('46elk API key not configured')
      }

      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: message.to,
          from: message.from,
          message: message.message
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`SMS API error: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        message_id: data.message_id
      }
    } catch (error) {
      console.error('SMS sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Create SMS message for high-scoring listing
  createHighScoreMessage(listing: {
    title: string
    price: number
    currency: string
    ai_score: number
    ai_confidence: number
    blocket_url?: string
    frontend_url?: string
  }, phoneNumber: string): SMSMessage {
    const scoreEmoji = listing.ai_score === 5 ? '🚨' : '💰'
    const scoreText = listing.ai_score === 5 ? 'MYCKET UNDERVÄRDET' : 'UNDERVÄRDET'
    
    const message = `${scoreEmoji} ${scoreText} OBJEKT HITTAT!

Score: ${listing.ai_score}/5 (${Math.round(listing.ai_confidence * 100)}% säker)
Titel: ${listing.title}
Pris: ${listing.price} ${listing.currency}

${listing.frontend_url ? `🔗 Frontend: ${listing.frontend_url}` : ''}
${listing.blocket_url ? `🛒 Blocket: ${listing.blocket_url}` : ''}

Köp snabbt innan någon annan hinner!`

    return {
      to: phoneNumber,
      from: this.sender,
      message: message
    }
  }

  // Check SMS delivery status
  async checkDeliveryStatus(messageId: string): Promise<{
    status: 'delivered' | 'failed' | 'pending'
    error?: string
  }> {
    try {
      if (!this.apiKey) {
        throw new Error('46elk API key not configured')
      }

      const response = await fetch(`${this.baseUrl}/status/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      switch (data.status) {
        case 'delivered':
          return { status: 'delivered' }
        case 'failed':
          return { status: 'failed', error: data.error }
        default:
          return { status: 'pending' }
      }
    } catch (error) {
      console.error('Delivery status check failed:', error)
      return { status: 'pending' }
    }
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber: string): boolean {
    // Swedish phone number format: +46701234567 or 0701234567
    const swedishPhoneRegex = /^(\+46|0)[1-9]\d{8}$/
    return swedishPhoneRegex.test(phoneNumber)
  }

  // Format phone number to international format
  formatPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.startsWith('0')) {
      return '+46' + phoneNumber.substring(1)
    }
    if (phoneNumber.startsWith('+46')) {
      return phoneNumber
    }
    return '+46' + phoneNumber
  }
}

// Export singleton instance
export const smsService = new SMSService()
