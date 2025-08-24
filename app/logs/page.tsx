'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  MessageSquare, 
  DollarSign, 
  Package,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { formatDate } from '../../components/utils'

interface MonitoringStats {
  total_listings: number
  analyzed_listings: number
  high_score_listings: number
  profit_analyzed_listings: number
  first_discovery: string
  last_discovery: string
}

interface Discovery {
  discovery_date: string
  new_listings: number
  analyzed_count: number
  high_score_count: number
}

interface SMSNotification {
  id: string
  listing_id: string
  phone_number: string
  message: string
  status: 'sent' | 'failed' | 'pending'
  created_at: string
  title?: string
  ai_score?: number
  price?: number
  currency?: string
}

interface CategoryStat {
  category: string
  count: number
  avg_price: number
  high_score_count: number
}

interface PriceStat {
  price_range: string
  count: number
  high_score_count: number
}

export default function LogsPage() {
  const [stats, setStats] = useState<MonitoringStats | null>(null)
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [smsHistory, setSmsHistory] = useState<SMSNotification[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [priceStats, setPriceStats] = useState<PriceStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/logs')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setStats(result.data.stats)
        setDiscoveries(result.data.discoveries)
        setSmsHistory(result.data.smsHistory)
        setCategoryStats(result.data.categoryStats)
        setPriceStats(result.data.priceStats)
      } else {
        throw new Error(result.error || 'Failed to fetch logs')
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Laddar loggar...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Fel vid laddning av loggar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchLogs}>Försök igen</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">📊 Blocket Monitor Loggar</h1>
        <p className="text-lg text-gray-600">
          Statistik och historik över alla hämtningar från Blocket
        </p>
        <Button 
          onClick={fetchLogs} 
          variant="outline" 
          className="mt-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Uppdatera
        </Button>
      </div>

      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Totalt listings</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.total_listings}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Analyserade</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.analyzed_listings}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-600">Högpoäng (4-5)</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.high_score_listings}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Vinstanalys</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.profit_analyzed_listings}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="discoveries" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discoveries">📅 Upptäckter</TabsTrigger>
          <TabsTrigger value="categories">📊 Kategorier</TabsTrigger>
          <TabsTrigger value="prices">💰 Prisintervall</TabsTrigger>
          <TabsTrigger value="sms">📱 SMS Historik</TabsTrigger>
        </TabsList>

        {/* Discoveries Tab */}
        <TabsContent value="discoveries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upptäckter per dag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {discoveries.map((discovery, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium">
                        {formatDate(discovery.discovery_date)}
                      </div>
                      <Badge variant="outline">
                        {discovery.new_listings} nya
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">
                        {discovery.analyzed_count} analyserade
                      </div>
                      {discovery.high_score_count > 0 && (
                        <Badge className="bg-orange-100 text-orange-800">
                          {discovery.high_score_count} högpoäng
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Kategoristatistik
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryStats.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="font-medium">{category.category}</div>
                      <Badge variant="outline">
                        {category.count} listings
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">
                        Snitt: {Math.round(category.avg_price)} kr
                      </div>
                      {category.high_score_count > 0 && (
                        <Badge className="bg-orange-100 text-orange-800">
                          {category.high_score_count} högpoäng
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prices Tab */}
        <TabsContent value="prices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Prisintervall
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {priceStats.map((price, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="font-medium">{price.price_range}</div>
                      <Badge variant="outline">
                        {price.count} listings
                      </Badge>
                    </div>
                    {price.high_score_count > 0 && (
                      <Badge className="bg-orange-100 text-orange-800">
                        {price.high_score_count} högpoäng
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                SMS Notifikationer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {smsHistory.length > 0 ? (
                  smsHistory.map((sms) => (
                    <div key={sms.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(sms.status)}
                          <Badge className={getStatusColor(sms.status)}>
                            {sms.status === 'sent' ? 'Skickat' : 
                             sms.status === 'failed' ? 'Misslyckades' : 'Väntar'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(sms.created_at)}
                        </div>
                      </div>
                      
                      {sms.title && (
                        <div className="mb-2">
                          <strong>{sms.title}</strong>
                          {sms.ai_score && (
                            <Badge className="ml-2 bg-blue-100 text-blue-800">
                              AI: {sms.ai_score}/5
                            </Badge>
                          )}
                          {sms.price && (
                            <Badge className="ml-2 bg-green-100 text-green-800">
                              {sms.price} {sms.currency}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-600">
                        {sms.message.substring(0, 100)}...
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Inga SMS-notifikationer än</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      {stats && (
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Första upptäckten: {formatDate(stats.first_discovery)} | 
            Senaste upptäckten: {formatDate(stats.last_discovery)}
          </p>
        </div>
      )}
    </div>
  )
}
