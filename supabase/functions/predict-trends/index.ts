import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2.38.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables")
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request parameters
    const url = new URL(req.url)
    const period = url.searchParams.get("period") || "month"
    const category = url.searchParams.get("category") || null
    const department = url.searchParams.get("department") || null
    const predictionMonths = parseInt(url.searchParams.get("months") || "3", 10)
    
    // Get historical data
    const { data: historicalData, error } = await supabase
      .from("complaints")
      .select("submitted_at, status, category, assigned_department")
      .order("submitted_at", { ascending: true })
    
    if (error) throw error
    
    // Apply filters
    let filteredData = historicalData
    if (category) {
      filteredData = filteredData.filter(item => item.category === category)
    }
    if (department) {
      filteredData = filteredData.filter(item => item.assigned_department === department)
    }
    
    // Group data by time periods
    const groupedData = groupDataByPeriod(filteredData, period)
    
    // Generate predictions using simple linear regression
    const predictions = predictFutureData(groupedData, predictionMonths)
    
    // Prepare response
    const response = {
      historical: groupedData,
      predictions: predictions,
      metadata: {
        period,
        category,
        department,
        predictionMonths
      }
    }
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    )
    
  } catch (error) {
    console.error("Error:", error.message)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    )
  }
})

// Group data by time periods (month, quarter, year)
function groupDataByPeriod(data: any[], period: string) {
  const groupedData: Record<string, { total: number, resolved: number, pending: number }> = {}
  
  data.forEach(item => {
    const date = new Date(item.submitted_at)
    let periodKey: string
    
    switch (period) {
      case "week":
        // Get ISO week number
        const weekNumber = getWeekNumber(date)
        periodKey = `${date.getFullYear()}-W${weekNumber}`
        break
      case "month":
        periodKey = `${date.getFullYear()}-${date.getMonth() + 1}`
        break
      case "quarter":
        const quarter = Math.floor(date.getMonth() / 3) + 1
        periodKey = `${date.getFullYear()}-Q${quarter}`
        break
      case "year":
        periodKey = `${date.getFullYear()}`
        break
      default:
        periodKey = `${date.getFullYear()}-${date.getMonth() + 1}`
    }
    
    if (!groupedData[periodKey]) {
      groupedData[periodKey] = { total: 0, resolved: 0, pending: 0 }
    }
    
    groupedData[periodKey].total++
    
    if (item.status === "resolved") {
      groupedData[periodKey].resolved++
    } else if (item.status === "pending") {
      groupedData[periodKey].pending++
    }
  })
  
  // Convert to array and sort by period
  return Object.entries(groupedData)
    .map(([period, counts]) => ({
      period,
      ...counts
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

// Get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Predict future data using simple linear regression
function predictFutureData(historicalData: any[], months: number) {
  if (historicalData.length < 2) {
    return []
  }
  
  // Extract x (time periods as indices) and y (complaint counts) values
  const x: number[] = historicalData.map((_, index) => index)
  const yTotal: number[] = historicalData.map(item => item.total)
  const yResolved: number[] = historicalData.map(item => item.resolved)
  
  // Calculate linear regression coefficients for total complaints
  const totalCoefficients = linearRegression(x, yTotal)
  
  // Calculate linear regression coefficients for resolved complaints
  const resolvedCoefficients = linearRegression(x, yResolved)
  
  // Generate predictions
  const predictions = []
  const lastPeriod = historicalData[historicalData.length - 1].period
  
  for (let i = 1; i <= months; i++) {
    const nextIndex = x.length + i - 1
    const predictedTotal = Math.max(0, Math.round(totalCoefficients.slope * nextIndex + totalCoefficients.intercept))
    const predictedResolved = Math.max(0, Math.round(resolvedCoefficients.slope * nextIndex + resolvedCoefficients.intercept))
    const predictedPending = Math.max(0, predictedTotal - predictedResolved)
    
    // Generate next period label
    const nextPeriod = getNextPeriod(lastPeriod, i)
    
    predictions.push({
      period: nextPeriod,
      total: predictedTotal,
      resolved: predictedResolved,
      pending: predictedPending,
      isPrediction: true
    })
  }
  
  return predictions
}

// Calculate linear regression coefficients
function linearRegression(x: number[], y: number[]) {
  const n = x.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0
  
  for (let i = 0; i < n; i++) {
    sumX += x[i]
    sumY += y[i]
    sumXY += x[i] * y[i]
    sumXX += x[i] * x[i]
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  return { slope, intercept }
}

// Generate next period label
function getNextPeriod(lastPeriod: string, increment: number): string {
  if (lastPeriod.includes("-W")) {
    // Weekly format: YYYY-WXX
    const [year, week] = lastPeriod.split("-W").map(Number)
    const newWeek = week + increment
    if (newWeek > 52) {
      return `${year + Math.floor((newWeek - 1) / 52)}-W${((newWeek - 1) % 52) + 1}`
    }
    return `${year}-W${newWeek}`
  } else if (lastPeriod.includes("-Q")) {
    // Quarterly format: YYYY-QX
    const [year, quarter] = lastPeriod.split("-Q").map(Number)
    const newQuarter = quarter + increment
    if (newQuarter > 4) {
      return `${year + Math.floor((newQuarter - 1) / 4)}-Q${((newQuarter - 1) % 4) + 1}`
    }
    return `${year}-Q${newQuarter}`
  } else if (lastPeriod.includes("-")) {
    // Monthly format: YYYY-MM
    const [year, month] = lastPeriod.split("-").map(Number)
    const newMonth = month + increment
    if (newMonth > 12) {
      return `${year + Math.floor((newMonth - 1) / 12)}-${((newMonth - 1) % 12) + 1}`
    }
    return `${year}-${newMonth}`
  } else {
    // Yearly format: YYYY
    const year = Number(lastPeriod)
    return `${year + increment}`
  }
}