"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Zap, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { getAIQuotaStatus } from "@/app/actions"

interface QuotaStatus {
  used: number
  limit: number
  remaining: number
  percentageUsed: number
  hoursUntilReset: number
  isLimitReached: boolean
  lastReset: string
}

export function AIQuotaMonitor() {
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchQuotaStatus = async () => {
    setIsLoading(true)
    try {
      const status = await getAIQuotaStatus()
      setQuotaStatus(status)
    } catch (error) {
      console.error("Failed to fetch quota status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotaStatus()
    // Refresh every 5 minutes
    const interval = setInterval(fetchQuotaStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    if (!quotaStatus) return "text-gray-500"
    if (quotaStatus.isLimitReached) return "text-red-600"
    if (quotaStatus.percentageUsed > 80) return "text-orange-600"
    if (quotaStatus.percentageUsed > 50) return "text-yellow-600"
    return "text-green-600"
  }

  const getStatusIcon = () => {
    if (!quotaStatus) return <Clock className="h-4 w-4" />
    if (quotaStatus.isLimitReached) return <AlertTriangle className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (!quotaStatus) return "Loading..."
    if (quotaStatus.isLimitReached) return "Quota Exhausted"
    if (quotaStatus.percentageUsed > 80) return "High Usage"
    return "Normal"
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="flex-1">GPT-3.5 Turbo Quota</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchQuotaStatus}
            disabled={isLoading}
            className="h-6 w-6 p-0 flex-shrink-0"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quotaStatus ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className={`${getStatusColor()} flex items-center gap-1 px-2 py-1`}>
                {getStatusIcon()}
                <span className="text-xs sm:text-sm font-medium">{getStatusText()}</span>
              </Badge>
              <span className="text-xs sm:text-sm text-gray-600 font-mono">
                {quotaStatus.used}/{quotaStatus.limit}
              </span>
            </div>
            
            <Progress 
              value={quotaStatus.percentageUsed} 
              className="h-2 sm:h-3"
              // @ts-ignore
              indicatorClassName={quotaStatus.isLimitReached ? "bg-red-500" : quotaStatus.percentageUsed > 80 ? "bg-orange-500" : "bg-green-500"}
            />
            
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm text-gray-600">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="font-medium">Remaining:</span> 
                <span className="font-mono">{quotaStatus.remaining}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="font-medium">Reset in:</span> 
                <span className="font-mono">{quotaStatus.hoursUntilReset}h</span>
              </div>
            </div>
            
            {quotaStatus.isLimitReached && (
              <div className="text-xs sm:text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">AI quota limit reached</div>
                    <div className="text-red-500">System will use fallback responses until reset.</div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-500 text-sm py-4">
            <Clock className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            Loading quota status...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
