import { Pool } from 'pg'

// Database connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
})

// Database types
export interface Listing {
  id: string
  bevakning_id: string
  ad_id: string
  title: string
  price: number
  currency: string
  description?: string
  category?: string
  condition?: string
  location?: string
  seller_type?: string
  blocket_url?: string
  frontend_url?: string
  images?: Array<{
    url: string
    description?: string
    thumbnail_url?: string
  }>
  discovered_at: string | Date
  ai_score?: number
  ai_confidence?: number
  ai_reasoning?: string
  ai_factors?: string[]
  ai_recommendation?: string
  ai_analyzed_at?: string | Date
  ai_model?: string
  created_at: string | Date
  updated_at: string | Date
}

export interface SMSNotification {
  id: string
  listing_id: string
  phone_number: string
  message: string
  sent_at: Date
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  delivery_id?: string
  error_message?: string
  created_at: Date
}

export interface UserSettings {
  id: string
  user_id: string
  phone_number: string
  sms_enabled: boolean
  min_score_threshold: number
  notification_frequency: number
  max_sms_per_day: number
  category_filters: string[]
  created_at: Date
  updated_at: Date
}

// Database operations
export class DatabaseService {
  
  // Create bevakning
  static async createBevakning(bevakning: { bevakning_id: string; name: string; user_id: string; is_active?: boolean }): Promise<void> {
    const client = await pool.connect()
    try {
      const query = `
        INSERT INTO bevakningar (bevakning_id, name, user_id, is_active)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (bevakning_id) DO NOTHING
      `
      
      const values = [
        bevakning.bevakning_id,
        bevakning.name,
        bevakning.user_id,
        bevakning.is_active ?? true
      ]
      
      await client.query(query, values)
    } finally {
      client.release()
    }
  }

  // Create listing
  static async createListing(listing: Partial<Listing>): Promise<void> {
    const client = await pool.connect()
    try {
      const query = `
        INSERT INTO listings (
          bevakning_id, ad_id, title, price, currency, description, 
          category, condition, location, seller_type, blocket_url, frontend_url,
          images, discovered_at, ai_score, ai_confidence, ai_reasoning, ai_factors, 
          ai_recommendation, ai_analyzed_at, ai_model
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (ad_id) DO NOTHING
      `
      
      const values = [
        listing.bevakning_id,
        listing.ad_id,
        listing.title,
        listing.price,
        listing.currency || 'kr',
        listing.description,
        listing.category,
        listing.condition,
        listing.location,
        listing.seller_type,
        listing.blocket_url,
        listing.frontend_url,
        listing.images ? JSON.stringify(listing.images) : '[]',
        listing.discovered_at,
        listing.ai_score,
        listing.ai_confidence,
        listing.ai_reasoning,
        listing.ai_factors,
        listing.ai_recommendation,
        listing.ai_analyzed_at,
        listing.ai_model
      ]
      
      await client.query(query, values)
    } finally {
      client.release()
    }
  }

  // Get or create listing
  static async upsertListing(listing: Partial<Listing>): Promise<Listing> {
    const client = await pool.connect()
    try {
      const query = `
        INSERT INTO listings (
          bevakning_id, ad_id, title, price, currency, description, 
          category, condition, location, seller_type, blocket_url, frontend_url,
          images
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (ad_id) DO UPDATE SET
          title = EXCLUDED.title,
          price = EXCLUDED.price,
          images = EXCLUDED.images,
          updated_at = NOW()
        RETURNING *
      `
      
      const values = [
        listing.bevakning_id,
        listing.ad_id,
        listing.title,
        listing.price,
        listing.currency || 'kr',
        listing.description,
        listing.category,
        listing.condition,
        listing.location,
        listing.seller_type,
        listing.blocket_url,
        listing.frontend_url,
        listing.images ? JSON.stringify(listing.images) : '[]'
      ]
      
      const result = await client.query(query, values)
      return result.rows[0]
    } finally {
      client.release()
    }
  }
  
  // Update AI analysis for a listing
  static async updateAIAnalysis(adId: string, aiData: {
    score: number
    confidence: number
    reasoning: string
    factors: string[]
    recommendation: string
    model: string
  }): Promise<void> {
    const client = await pool.connect()
    try {
      const query = `
        UPDATE listings 
        SET 
          ai_score = $1,
          ai_confidence = $2,
          ai_reasoning = $3,
          ai_factors = $4,
          ai_recommendation = $5,
          ai_model = $6,
          ai_analyzed_at = NOW(),
          updated_at = NOW()
        WHERE ad_id = $7
      `
      
      const values = [
        aiData.score,
        aiData.confidence,
        aiData.reasoning,
        aiData.factors,
        aiData.recommendation,
        aiData.model,
        adId
      ]
      
      await client.query(query, values)
    } finally {
      client.release()
    }
  }
  
  // Get listings that need AI analysis
  static async getListingsNeedingAnalysis(bevakningId: string): Promise<Listing[]> {
    const client = await pool.connect()
    try {
      const query = `
        SELECT * FROM listings 
        WHERE bevakning_id = $1 
        AND ai_score IS NULL
        ORDER BY discovered_at DESC
      `
      
      const result = await client.query(query, [bevakningId])
      return result.rows
    } finally {
      client.release()
    }
  }
  
  // Get high-scoring listings for SMS notifications
  static async getHighScoringListings(bevakningId: string, minScore: number): Promise<Listing[]> {
    const client = await pool.connect()
    try {
      const query = `
        SELECT l.* FROM listings l
        LEFT JOIN sms_notifications sn ON l.id = sn.listing_id
        WHERE l.bevakning_id = $1 
        AND l.ai_score >= $2
        AND sn.id IS NULL
        ORDER BY l.ai_score DESC, l.ai_confidence DESC
      `
      
      const result = await client.query(query, [bevakningId, minScore])
      return result.rows
    } finally {
      client.release()
    }
  }
  
  // Create SMS notification
  static async createSMSNotification(notification: Partial<SMSNotification>): Promise<SMSNotification> {
    const client = await pool.connect()
    try {
      const query = `
        INSERT INTO sms_notifications (
          listing_id, phone_number, message, status
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `
      
      const values = [
        notification.listing_id,
        notification.phone_number,
        notification.message,
        notification.status || 'pending'
      ]
      
      const result = await client.query(query, values)
      return result.rows[0]
    } finally {
      client.release()
    }
  }
  
  // Update SMS notification status
  static async updateSMSStatus(id: string, status: string, deliveryId?: string, errorMessage?: string): Promise<void> {
    const client = await pool.connect()
    try {
      const query = `
        UPDATE sms_notifications 
        SET 
          status = $1,
          delivery_id = $2,
          error_message = $3,
          sent_at = CASE WHEN $1 = 'sent' THEN NOW() ELSE sent_at END
        WHERE id = $4
      `
      
      const values = [status, deliveryId, errorMessage, id]
      await client.query(query, values)
    } finally {
      client.release()
    }
  }
  
  // Get user settings
  static async getUserSettings(userId: string = 'default_user'): Promise<UserSettings> {
    const client = await pool.connect()
    try {
      const query = `
        SELECT * FROM user_settings 
        WHERE user_id = $1
      `
      
      const result = await client.query(query, [userId])
      
      if (result.rows.length === 0) {
        // Create default settings if none exist
        const defaultSettings: UserSettings = {
          id: 'default',
          user_id: userId,
          phone_number: '+46701234567',
          sms_enabled: true,
          min_score_threshold: 4,
          notification_frequency: 10,
          max_sms_per_day: 20,
          category_filters: ['all'],
          created_at: new Date(),
          updated_at: new Date()
        }
        
        // Try to insert default settings
        try {
          await this.createUserSettings(userId, defaultSettings)
          return defaultSettings
        } catch (insertError) {
          console.warn('Failed to create default settings, returning fallback:', insertError)
          return defaultSettings
        }
      }
      
      return result.rows[0]
    } finally {
      client.release()
    }
  }
  
  // Create user settings
  static async createUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    const client = await pool.connect()
    try {
      const query = `
        INSERT INTO user_settings (
          user_id, phone_number, sms_enabled, min_score_threshold, 
          notification_frequency, max_sms_per_day, category_filters
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id) DO NOTHING
      `
      
      const values = [
        userId,
        settings.phone_number || '+46701234567',
        settings.sms_enabled ?? true,
        settings.min_score_threshold || 4,
        settings.notification_frequency || 10,
        settings.max_sms_per_day || 20,
        settings.category_filters || ['all']
      ]
      
      await client.query(query, values)
    } finally {
      client.release()
    }
  }

  // Update user settings
  static async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    const client = await pool.connect()
    try {
      const query = `
        UPDATE user_settings 
        SET 
          phone_number = COALESCE($1, phone_number),
          sms_enabled = COALESCE($2, sms_enabled),
          min_score_threshold = COALESCE($3, min_score_threshold),
          notification_frequency = COALESCE($4, notification_frequency),
          max_sms_per_day = COALESCE($5, max_sms_per_day),
          category_filters = COALESCE($6, category_filters),
          updated_at = NOW()
        WHERE user_id = $7
      `
      
      const values = [
        settings.phone_number,
        settings.sms_enabled,
        settings.min_score_threshold,
        settings.notification_frequency,
        settings.max_sms_per_day,
        settings.category_filters,
        userId
      ]
      
      await client.query(query, values)
    } finally {
      client.release()
    }
  }
  
  // Check if we've sent too many SMS today
  static async getSMSCountToday(phoneNumber: string): Promise<number> {
    const client = await pool.connect()
    try {
      const query = `
        SELECT COUNT(*) FROM sms_notifications 
        WHERE phone_number = $1 
        AND DATE(sent_at) = CURRENT_DATE
        AND status IN ('sent', 'delivered')
      `
      
      const result = await client.query(query, [phoneNumber])
      return parseInt(result.rows[0].count)
    } finally {
      client.release()
    }
  }
  
  // Get all listings
  static async getAllListings(): Promise<Listing[]> {
    const client = await pool.connect()
    try {
      const query = `
        SELECT * FROM listings 
        ORDER BY discovered_at DESC
      `
      
      const result = await client.query(query)
      return result.rows.map(row => ({
        ...row,
        discovered_at: row.discovered_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        ai_analyzed_at: row.ai_analyzed_at
      }))
    } finally {
      client.release()
    }
  }

  // Initialize default settings for a user
  static async initializeDefaultSettings(userId: string = 'default_user'): Promise<void> {
    const client = await pool.connect()
    try {
      const query = `
        INSERT INTO user_settings (
          user_id, phone_number, sms_enabled, min_score_threshold, 
          notification_frequency, max_sms_per_day, category_filters
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id) DO NOTHING
      `
      
      const values = [
        userId,
        '+46701234567',
        true,
        4,
        10,
        20,
        ['all']
      ]
      
      await client.query(query, values)
    } finally {
      client.release()
    }
  }

  // Update listing images
  static async updateListingImages(adId: string, images: Array<{
    url: string
    description?: string
    thumbnail_url?: string
  }>): Promise<void> {
    const client = await pool.connect()
    try {
      const query = `
        UPDATE listings 
        SET images = $1, updated_at = NOW()
        WHERE ad_id = $2
      `
      
      const values = [JSON.stringify(images), adId]
      await client.query(query, values)
    } finally {
      client.release()
    }
  }

  // Close database connection
  static async close(): Promise<void> {
    await pool.end()
  }
}
