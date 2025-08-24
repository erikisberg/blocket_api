'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIAnalysisResult, ListingForAnalysis, getCachedAnalysis, isAnalysisFresh } from './lib/ai-analysis'
import { Brain, TrendingUp, TrendingDown, Minus, Star, Loader2, RefreshCw, Clock } from 'lucide-react'

interface AIAnalysisCardProps {
  listing: ListingForAnalysis
  listingId?: string
  bevakningId?: string
  cachedAnalysis?: AIAnalysisResult | null
  onAnalysisComplete?: (result: AIAnalysisResult) => void
}

export function AIAnalysisCard({ listing, listingId, bevakningId, cachedAnalysis, onAnalysisComplete }: AIAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(cachedAnalysis || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset analysis when listingId or listing changes
  useEffect(() => {
    console.log('🔄 AIAnalysisCard updating for listing:', listingId, 'title:', listing.title)
    setAnalysis(cachedAnalysis || null)
    setError(null)
  }, [listingId, cachedAnalysis, listing.title, listing.price])

  const analyzeListing = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          listing,
          listingId,
          bevakningId
        }),
      })

      if (!response.ok) {
        throw new Error('Analys misslyckades')
      }

      const data = await response.json()
      if (data.success) {
        setAnalysis(data.result)
        onAnalysisComplete?.(data.result)
      } else {
        throw new Error(data.error || 'Okänt fel')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  const getScoreIcon = (score: number) => {
    if (score >= 4) return <TrendingUp className="h-5 w-5 text-green-600" />
    if (score <= 2) return <TrendingDown className="h-5 w-5 text-red-600" />
    return <Minus className="h-5 w-5 text-gray-600" />
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-blue-600'
    if (score >= 2) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    switch (score) {
      case 1: return 'Mycket övervärderat'
      case 2: return 'Övervärderat'
      case 3: return 'Rättvärderat'
      case 4: return 'Undervärderat'
      case 5: return 'Mycket undervärderat'
      default: return 'Okänt'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-blue-600'
    if (confidence >= 0.4) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg">AI-värderingsanalys</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Bedömning av om objektet kan vara undervärd
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {!analysis && !loading && (
          <div className="text-center py-6">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">
              Få en AI-bedömning av detta objekts marknadsvärde
            </p>
            <Button onClick={analyzeListing} className="w-full">
              Starta AI-analys
            </Button>
          </div>
        )}

        {analysis && !loading && !isAnalysisFresh(analysis) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Analys är gammal</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Denna analys gjordes {new Date(analysis.analyzedAt).toLocaleDateString('sv-SE')} och kan vara föråldrad.
            </p>
            <Button 
              onClick={analyzeListing} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Uppdatera analys
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-6">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-purple-600" />
            <p className="text-gray-600">AI analyserar objektet...</p>
            <p className="text-sm text-gray-500">Detta kan ta några sekunder</p>
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Analys misslyckades</p>
              <p className="text-red-600 text-sm">{error}</p>
              <Button 
                onClick={analyzeListing} 
                variant="outline" 
                className="mt-3"
              >
                Försök igen
              </Button>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Score Display */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                {getScoreIcon(analysis.score)}
                <span className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
                  {analysis.score}/5
                </span>
              </div>
              <p className={`font-medium ${getScoreColor(analysis.score)}`}>
                {getScoreLabel(analysis.score)}
              </p>
              
              {/* Confidence */}
              <div className="mt-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Tillförlitlighet</span>
                </div>
                <div className="w-32 h-2 bg-gray-200 rounded-full mx-auto">
                  <div 
                    className={`h-2 rounded-full ${getConfidenceColor(analysis.confidence)}`}
                    style={{ width: `${analysis.confidence * 100}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${getConfidenceColor(analysis.confidence)}`}>
                  {Math.round(analysis.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Reasoning */}
            <div>
              <h4 className="font-semibold mb-2">AI-bedömning</h4>
              <p className="text-gray-700 leading-relaxed">{analysis.reasoning}</p>
            </div>

            {/* Factors */}
            {analysis.factors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Viktiga faktorer</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.factors.map((factor, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div>
              <h4 className="font-semibold mb-2">Handelsrekommendation</h4>
              <p className="text-gray-700 leading-relaxed">{analysis.recommendation}</p>
            </div>

            {/* Profit Analysis */}
            {analysis.profit_analysis && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-green-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Vinstanalys
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Lagringskostnad:</span>
                    <p className="text-green-700 font-semibold">{analysis.profit_analysis.estimated_repair_cost}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Lagringstid:</span>
                    <p className="text-green-700 font-semibold">{analysis.profit_analysis.estimated_repair_time}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Förväntat försäljningspris:</span>
                    <p className="text-green-700 font-semibold">{analysis.profit_analysis.estimated_sale_price}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Beräknad vinst:</span>
                    <p className="text-green-700 font-semibold">{analysis.profit_analysis.estimated_profit}</p>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Vinstmarginal:</span>
                    <p className="text-green-700 font-semibold">{analysis.profit_analysis.profit_margin_percent}</p>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Risknivå:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      analysis.profit_analysis.risk_level === 'Låg' ? 'bg-green-100 text-green-800' :
                      analysis.profit_analysis.risk_level === 'Medel' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {analysis.profit_analysis.risk_level}
                    </span>
                  </div>
                </div>
                
                {/* Repair Items */}
                {analysis.profit_analysis.repair_items && analysis.profit_analysis.repair_items.length > 0 && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-700">Vad behöver fixas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {analysis.profit_analysis.repair_items.map((item, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Market Comparison */}
                {analysis.profit_analysis.market_comparison && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-700">Marknadsjämförelse:</span>
                    <p className="text-gray-700 text-sm mt-1">{analysis.profit_analysis.market_comparison}</p>
                  </div>
                )}
              </div>
            )}

            {/* Analysis metadata */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>Analyserad: {new Date(analysis.analyzedAt).toLocaleString('sv-SE')}</span>
                <span>Modell: {analysis.model}</span>
              </div>
              
              <Button 
                onClick={analyzeListing} 
                variant="outline" 
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Analysera igen
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
