'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIAnalysisResult, ListingForAnalysis } from './ai-analysis-frontend'
import { Brain, TrendingUp, Filter, Loader2, AlertCircle } from 'lucide-react'

interface BatchAnalysisProps {
  listings: ListingForAnalysis[]
}

interface AnalysisResultWithListing {
  listing: ListingForAnalysis
  result: AIAnalysisResult
}

export function BatchAnalysis({ listings }: BatchAnalysisProps) {
  const [results, setResults] = useState<AnalysisResultWithListing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterScore, setFilterScore] = useState<number>(4) // Show undervalued items by default

  const analyzeAll = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ multipleListings: listings }),
      })

      if (!response.ok) {
        throw new Error('Batch-analys misslyckades')
      }

      const data = await response.json()
      if (data.success) {
        const resultsWithListings = listings.map((listing, index) => ({
          listing,
          result: data.results[index]
        }))
        setResults(resultsWithListings)
      } else {
        throw new Error(data.error || 'Okänt fel')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  const filteredResults = results.filter(item => item.result.score >= filterScore)
  const sortedResults = filteredResults.sort((a, b) => b.result.score - a.result.score)

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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg">Batch AI-analys</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Analysera alla annonser för att hitta undervärderade objekt
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {!loading && results.length === 0 && (
          <div className="text-center py-6">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">
              Analysera alla {listings.length} annonser för att hitta dolda guldkorn
            </p>
            <Button onClick={analyzeAll} className="w-full">
              Starta batch-analys
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Detta kan ta flera minuter beroende på antal annonser
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-6">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-purple-600" />
            <p className="text-gray-600">AI analyserar alla annonser...</p>
            <p className="text-sm text-gray-500">
              {listings.length} annonser att analysera
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <p className="text-red-800 font-medium">Batch-analys misslyckades</p>
              <p className="text-red-600 text-sm">{error}</p>
              <Button 
                onClick={analyzeAll} 
                variant="outline" 
                className="mt-3"
              >
                Försök igen
              </Button>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {/* Filter Controls */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Visa objekt med poäng:</span>
              </div>
              <select
                value={filterScore}
                onChange={(e) => setFilterScore(Number(e.target.value))}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value={1}>1+ (Alla)</option>
                <option value={2}>2+ (Övervärderat och uppåt)</option>
                <option value={3}>3+ (Rättvärderat och uppåt)</option>
                <option value={4}>4+ (Endast undervärderade)</option>
                <option value={5}>5 (Endast mycket undervärderade)</option>
              </select>
              <span className="text-sm text-gray-600">
                {filteredResults.length} av {results.length} objekt
              </span>
            </div>

            {/* Results */}
            <div className="space-y-3">
              {sortedResults.map((item, index) => (
                <div 
                  key={item.listing.title + index}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{item.listing.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {item.listing.price} {item.listing.currency} • {item.listing.location}
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {item.listing.description}
                      </p>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className={`text-2xl font-bold ${getScoreColor(item.result.score)}`}>
                        {item.result.score}/5
                      </div>
                      <div className={`text-sm font-medium ${getScoreColor(item.result.score)}`}>
                        {getScoreLabel(item.result.score)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(item.result.confidence * 100)}% tillförlitlighet
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Reasoning */}
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-700">
                      <strong>AI-bedömning:</strong> {item.result.reasoning}
                    </p>
                    {item.result.recommendation && (
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Rekommendation:</strong> {item.result.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Analyssammanfattning</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                {[1, 2, 3, 4, 5].map(score => {
                  const count = results.filter(r => r.result.score === score).length
                  return (
                    <div key={score} className="text-center">
                      <div className={`font-bold ${getScoreColor(score)}`}>
                        {score}/5
                      </div>
                      <div className="text-gray-600">{count} objekt</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Re-analyze button */}
            <div className="pt-4 border-t">
              <Button 
                onClick={analyzeAll} 
                variant="outline" 
                className="w-full"
              >
                Analysera igen
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
