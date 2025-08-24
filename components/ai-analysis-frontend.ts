// Frontend-only version of AI analysis utilities
// This file contains only browser-compatible code

export interface AIAnalysisResult {
  score: number // 1-5 score
  reasoning: string
  confidence: number // 0-1
  factors: string[]
  recommendation: string
  analyzedAt: string // When the analysis was performed
  model: string // Which AI model was used
  profit_analysis?: {
    estimated_repair_cost: string
    estimated_repair_time: string
    estimated_sale_price: string
    estimated_profit: string
    profit_margin_percent: string
    risk_level: string
    repair_items: string[]
    market_comparison: string
  }
}

export interface ListingForAnalysis {
  title: string
  description: string
  price: number
  currency: string
  category: string
  condition?: string
  images?: Array<{
    url: string
    description?: string
  }>
  location: string
  sellerType: string
}

// Function to save AI analysis results to the database via API
export async function saveAnalysisResults(bevakningId: string, listingId: string, result: AIAnalysisResult): Promise<void> {
  try {
    console.log(`💾 Saving AI analysis for listing ${listingId} in bevakning ${bevakningId}`)
    
    // Always use API call for frontend components
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/save-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bevakningId,
        listingId,
        analysis: result
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to save analysis: ${errorData.error || response.statusText}`)
    }

    const saveResult = await response.json()
    console.log(`✅ AI analysis saved successfully:`, saveResult.message)
  } catch (error) {
    console.error('❌ Failed to save analysis results:', error)
    throw error // Re-throw so calling function knows it failed
  }
}

// Function to load cached AI analysis results from database
export function getCachedAnalysis(listing: any): AIAnalysisResult | null {
  // Check if we have AI analysis data from database
  if (listing.ai_score && listing.ai_reasoning) {
    return {
      score: listing.ai_score,
      reasoning: listing.ai_reasoning,
      confidence: listing.ai_confidence || 0.5,
      factors: listing.ai_factors || [],
      recommendation: listing.ai_recommendation || '',
      analyzedAt: listing.ai_analyzed_at || new Date().toISOString(),
      model: listing.ai_model || 'claude-opus-4-1-20250805',
      profit_analysis: listing.profit_analysis || undefined
    }
  }
  
  // Fallback to old format
  if (listing.ai_analysis) {
    return listing.ai_analysis
  }
  
  return null
}

// Function to check if analysis is fresh (within 24 hours)
export function isAnalysisFresh(analysis: AIAnalysisResult): boolean {
  if (!analysis.analyzedAt) return false
  
  try {
    const analyzedDate = new Date(analysis.analyzedAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - analyzedDate.getTime()) / (1000 * 60 * 60)
    
    return hoursDiff < 24 // Consider fresh if less than 24 hours old
  } catch (error) {
    console.warn('⚠️ Error checking analysis freshness:', error)
    return false // If we can't parse the date, consider it stale
  }
}
