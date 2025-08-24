import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '../../../components/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bevakningId, listingId, analysis } = body

    if (!bevakningId || !listingId || !analysis) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log(`💾 Saving AI analysis for listing ${listingId} in bevakning ${bevakningId}`)
    console.log('Analysis data:', analysis)

    // Save AI analysis to database
    await DatabaseService.updateAIAnalysis(listingId, {
      score: analysis.score,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      factors: analysis.factors,
      recommendation: analysis.recommendation,
      model: analysis.model || 'claude-opus-4-1-20250805'
    })

    console.log(`✅ AI analysis saved successfully for listing ${listingId}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Analysis saved successfully to database',
      listingId,
      bevakningId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error saving analysis to database:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save analysis to database',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
