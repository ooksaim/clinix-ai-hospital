"use client"

import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface LoadingIndicatorProps {
  isLoading: boolean
  hasError?: boolean
  label: string
  size?: "sm" | "md" | "lg"
}

export function LoadingIndicator({ 
  isLoading, 
  hasError = false, 
  label, 
  size = "sm" 
}: LoadingIndicatorProps) {
  const iconSize = size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"
  const textSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
  const padding = size === "sm" ? "px-2 py-1" : size === "md" ? "px-3 py-1.5" : "px-4 py-2"

  if (isLoading) {
    return (
      <Badge variant="outline" className={`text-blue-600 border-blue-200 bg-blue-50/50 backdrop-blur-sm ${padding} flex items-center gap-1.5`}>
        <RefreshCw className={`${iconSize} animate-spin`} />
        <span className={`${textSize} font-medium`}>{label}...</span>
      </Badge>
    )
  }

  if (hasError) {
    return (
      <Badge variant="outline" className={`text-red-600 border-red-200 bg-red-50/50 backdrop-blur-sm ${padding} flex items-center gap-1.5`}>
        <AlertCircle className={iconSize} />
        <span className={`${textSize} font-medium`}>Error</span>
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={`text-green-600 border-green-200 bg-green-50/50 backdrop-blur-sm ${padding} flex items-center gap-1.5`}>
      <CheckCircle className={iconSize} />
      <span className={`${textSize} font-medium`}>Ready</span>
    </Badge>
  )
}
