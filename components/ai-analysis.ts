import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
})

// Function to get original quality image URL from Blocket
function getOriginalQualityImageUrl(originalUrl: string): string {
  try {
    // Remove any existing query parameters
    let cleanUrl = originalUrl.split('?')[0]
    
    // Convert to .webp format if it's not already
    if (!cleanUrl.includes('.webp')) {
      // Extract the base path and image ID
      const urlParts = cleanUrl.split('/')
      const imageId = urlParts[urlParts.length - 1]
      
      // Remove file extension if present
      const imageIdWithoutExt = imageId.split('.')[0]
      
      // Reconstruct URL with .webp and original quality
      const basePath = urlParts.slice(0, -1).join('/')
      cleanUrl = `${basePath}/${imageIdWithoutExt}.webp`
    }
    
    // Add original quality parameter
    return `${cleanUrl}?type=original`
    
  } catch (error) {
    console.warn('Failed to enhance image URL, using original:', error)
    return originalUrl
  }
}



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

// Function to save AI analysis results to the listings file
export async function saveAnalysisResults(bevakningId: string, listingId: string, result: AIAnalysisResult): Promise<void> {
  try {
    console.log(`💾 Saving AI analysis for listing ${listingId} in bevakning ${bevakningId}`)
    
    // Use absolute URL for server-side fetch
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
    console.error('Failed to save analysis results:', error)
    throw error // Re-throw so calling function knows it failed
  }
}

// Function to load cached AI analysis results
export function getCachedAnalysis(listing: any): AIAnalysisResult | null {
  if (listing.ai_analysis) {
    return listing.ai_analysis
  }
  return null
}

// Function to check if analysis is fresh (within 24 hours)
export function isAnalysisFresh(analysis: AIAnalysisResult): boolean {
  if (!analysis.analyzedAt) return false
  
  const analyzedDate = new Date(analysis.analyzedAt)
  const now = new Date()
  const hoursDiff = (now.getTime() - analyzedDate.getTime()) / (1000 * 60 * 60)
  
  return hoursDiff < 24 // Consider fresh if less than 24 hours old
}

export async function analyzeListing(listing: ListingForAnalysis, listingId?: string, bevakningId?: string): Promise<AIAnalysisResult> {
  try {
    // Validate API key
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set. Please configure your API key in Vercel environment variables.')
    }
    
    if (apiKey === 'your_api_key_here' || apiKey === 'sk-ant-api03-din-nyckel-här') {
      throw new Error('Please replace the placeholder API key with your actual Anthropic API key in Vercel environment variables.')
    }
    
    console.log('🔑 Using Anthropic API key:', apiKey.substring(0, 10) + '...')
    
    // Create the analysis prompt
    const prompt = createAnalysisPrompt(listing)
    
    // Prepare content with images if available
    const content: any[] = [
      {
        type: 'text',
        text: prompt
      }
    ]

        // Add high-quality images to the content if available
    if (listing.images && listing.images.length > 0) {
      for (const image of listing.images) {
        try {
          // Get original quality image from Blocket
          const originalImageUrl = getOriginalQualityImageUrl(image.url)
          
          // Fetch original quality image
          const imageResponse = await fetch(originalImageUrl)
          const imageBuffer = await imageResponse.arrayBuffer()
          const base64Image = Buffer.from(imageBuffer).toString('base64')
          
          // Determine image type from URL
          const imageType = originalImageUrl.includes('.webp') ? 'image/webp' : 
                           originalImageUrl.includes('.png') ? 'image/png' : 'image/jpeg'
          
          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageType,
              data: base64Image
            }
          })
          
          console.log(`🖼️✨ Added ORIGINAL QUALITY image to AI analysis: ${originalImageUrl}`)
        } catch (imageError) {
          console.warn(`⚠️ Failed to add image ${image.url}:`, imageError)
          // Continue without this image
        }
      }
    }

    // Call Claude for analysis with images
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805', // Latest and most powerful model
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for consistent analysis
      messages: [
        {
          role: 'user',
          content: content
        }
      ]
    })

    // Parse the response
    const analysis = parseAIResponse(response.content[0].text)
    
    // Add metadata
    analysis.analyzedAt = new Date().toISOString()
    analysis.model = 'claude-opus-4-1-20250805'
    
    // Save results if we have the IDs
    if (listingId && bevakningId) {
      try {
        await saveAnalysisResults(bevakningId, listingId, analysis)
        console.log(`✅ Analysis completed and saved for listing ${listingId}`)
      } catch (saveError) {
        console.error(`❌ Failed to save analysis for listing ${listingId}:`, saveError)
        // Continue with analysis even if save fails
      }
    }
    
    return analysis
  } catch (error) {
    console.error('AI analysis failed:', error)
    
    // Return fallback analysis
    return {
      score: 3,
      reasoning: 'AI-analys misslyckades. Kontrollera API-nyckel och nätverksanslutning.',
      confidence: 0.1,
      factors: ['Analysfel'],
      recommendation: 'Manuell bedömning rekommenderas.',
      analyzedAt: new Date().toISOString(),
      model: 'fallback'
    }
  }
}

function createAnalysisPrompt(listing: ListingForAnalysis): string {
  return `
Du är en expert på att bedöma marknadsvärde för begagnade varor, särskilt cyklar och sportutrustning. 

**VIKTIGT: Du ska vara KRITISK och REALISTISK i din bedömning. Tänk på att köparen kan göra enkla lagningar och fixar för att öka värdet.**

Analysera följande annons och ge en bedömning på skalan 1-5 för hur undervärd objektet kan vara:

**ANNONSINFORMATION:**
- Titel: ${listing.title}
- Beskrivning: ${listing.description}
- Pris: ${listing.price} ${listing.currency}
- Kategori: ${listing.category}
- Skick: ${listing.condition || 'Ej angivet'}
- Plats: ${listing.location}
- Säljartyp: ${listing.sellerType}

**BILDINFORMATION:**
${listing.images ? listing.images.map((img, i) => 
  `- Bild ${i + 1}: ${img.description || 'Ingen beskrivning'} (bilden bifogas nedan)`
).join('\n') : 'Inga bilder tillgängliga'}

**VIKTIGT: Du kan nu SE alla bilder som bifogas. Analysera bilderna noggrant för att bedöma:**
- Skick och skador
- Kosmetiska vs strukturella problem
- Vad som kan fixas enkelt
- Bildkvalitet och presentation
- Säljarens omsorg om objektet

**ANALYSKRITERIER (KRITISK OCH REALISTISK):**
1 = Mycket övervärderat (priset är för högt, inte värt att köpa)
2 = Övervärderat (priset är något för högt, svårt att göra vinst)
3 = Rättvärderat (priset verkar rimligt, ingen stor vinstmarginal)
4 = Undervärderat (priset verkar för lågt, potentiell vinst efter enkla fix)
5 = Mycket undervärderat (priset är uppenbart för lågt, stor vinstmarginal efter fix)

**KRITISKA FRÅGOR ATT STÄLLA DIG:**
- Kan detta objekt fixas enkelt? (byta bromsskivor, laga kedja, rengöra, etc.)
- Är skadorna kosmetiska eller strukturella?
- Hur mycket kostar det att fixa? (uppskatta realistiskt)
- Finns det tillgängliga reservdelar?
- Är det värt att lägga tid på att fixa?

**REALISTISK VINSTBERÄKNING:**
- Räkna med att enkla fix kostar 200-1000 kr
- Tidskostnad: 1-4 timmar arbete
- Måste finnas minst 500-1000 kr vinstmarginal för att vara intressant
- Ta hänsyn till marknadspriser för liknande varor i bra skick

**VIKTIGT: Ge SPECIFIKA siffror för:**
- Exakt kostnad för delar och lagning (kr)
- Exakt tid för lagning (timmar)
- Förväntat försäljningspris efter lagning (kr)
- Beräknad vinst (kr)
- Vinstmarginal i procent
- Risknivå (Låg/Medel/Hög)
- Lista över exakt vad som behöver fixas

**SVARA I FÖLJANDE FORMAT:**
{
  "score": [1-5],
  "reasoning": "Detaljerad förklaring på svenska med fokus på fixkostnader och vinstmarginal",
  "confidence": [0.0-1.0],
  "factors": ["Faktor 1", "Faktor 2", "Faktor 3"],
  "recommendation": "Praktisk handelsrekommendation med fixkostnader och förväntad vinst",
  "profit_analysis": {
    "estimated_repair_cost": "Uppskattad kostnad för lagning och delar (kr)",
    "estimated_repair_time": "Uppskattad tid för lagning (timmar)",
    "estimated_sale_price": "Förväntat försäljningspris efter lagning (kr)",
    "estimated_profit": "Förväntad vinst efter lagning (kr)",
    "profit_margin_percent": "Vinstmarginal i procent",
    "risk_level": "Låg/Medel/Hög risk",
    "repair_items": ["Lista över vad som behöver fixas", "Ex: nya bromsskivor", "rengöring av kedja"],
    "market_comparison": "Jämförelse med marknadspriser för liknande varor i bra skick"
  }
}

**TÄNK PÅ:**
- Marknadspriser för liknande varor i BRA skick (efter fix)
- Skick och ålder - vad kan fixas enkelt?
- Säsongseffekter på marknaden
- Plats och tillgänglighet
- Säljarens betyg och typ
- Bildkvalitet och presentation
- Beskrivningens detaljeringsgrad
- **KRITISKT: Är det verkligen värt att lägga tid på?**

**VAR KRITISK: Inte alla "billiga" objekt är bra deals. Fokusera på objekt där du kan göra enkla fix och fortfarande ha en tydlig vinstmarginal.**
`
}

function parseAIResponse(responseText: string): AIAnalysisResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate and return the parsed result
      return {
        score: Math.max(1, Math.min(5, parsed.score || 3)),
        reasoning: parsed.reasoning || 'Ingen förklaring tillgänglig',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        factors: Array.isArray(parsed.factors) ? parsed.factors : ['Inga faktorer angivna'],
        recommendation: parsed.recommendation || 'Ingen rekommendation tillgänglig',
        profit_analysis: parsed.profit_analysis || undefined,
        analyzedAt: new Date().toISOString(),
        model: 'claude-opus-4-1-20250805'
      }
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error)
  }
  
  // Fallback parsing for non-JSON responses
  const scoreMatch = responseText.match(/score[:\s]*([1-5])/i)
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 3
  
  return {
    score,
    reasoning: responseText.substring(0, 200) + '...',
    confidence: 0.3,
    factors: ['Automatisk analys'],
    recommendation: 'Kontrollera analysen manuellt',
    profit_analysis: undefined,
    analyzedAt: new Date().toISOString(),
    model: 'fallback'
  }
}

// Batch analysis for multiple listings
export async function analyzeMultipleListings(listings: ListingForAnalysis[]): Promise<AIAnalysisResult[]> {
  // Validate API key first
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set. Please configure your API key in Vercel environment variables.')
  }
  
  if (apiKey === 'your_api_key_here' || apiKey === 'sk-ant-api03-din-nyckel-här') {
    throw new Error('Please replace the placeholder API key with your actual Anthropic API key in Vercel environment variables.')
  }
  
  console.log('🔑 Batch analysis using API key:', apiKey.substring(0, 10) + '...')
  
  const results: AIAnalysisResult[] = []
  
  for (const listing of listings) {
    try {
      const result = await analyzeListing(listing)
      results.push(result)
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`Failed to analyze listing: ${listing.title}`, error)
      results.push({
        score: 3,
        reasoning: 'Analys misslyckades',
        confidence: 0,
        factors: ['Fel'],
        recommendation: 'Försök igen senare',
        profit_analysis: undefined,
        analyzedAt: new Date().toISOString(),
        model: 'claude-opus-4-1-20250805'
      })
    }
  }
  
  return results
}
