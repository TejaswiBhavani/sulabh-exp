import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ChartProps {
  data: any
  options?: any
  className?: string
}

// Cultural color palette for charts
const culturalColors = {
  primary: '#ea580c',
  secondary: '#0284c7',
  success: '#16a34a',
  warning: '#f59e0b',
  error: '#dc2626',
  purple: '#7c3aed',
  pink: '#ec4899',
  indigo: '#4f46e5'
}

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: culturalColors.primary,
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        font: {
          size: 11
        }
      }
    }
  }
}

export const ComplaintTrendsChart: React.FC<ChartProps> = ({ data, className = '' }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Submitted',
        data: data.submitted,
        borderColor: culturalColors.primary,
        backgroundColor: `${culturalColors.primary}20`,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Resolved',
        data: data.resolved,
        borderColor: culturalColors.success,
        backgroundColor: `${culturalColors.success}20`,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Pending',
        data: data.pending,
        borderColor: culturalColors.warning,
        backgroundColor: `${culturalColors.warning}20`,
        fill: true,
        tension: 0.4
      }
    ]
  }

  return (
    <div className={`h-80 ${className}`}>
      <Line data={chartData} options={defaultOptions} />
    </div>
  )
}

export const CategoryDistributionChart: React.FC<ChartProps> = ({ data, className = '' }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: [
          culturalColors.primary,
          culturalColors.secondary,
          culturalColors.success,
          culturalColors.warning,
          culturalColors.error,
          culturalColors.purple
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((context.parsed / total) * 100).toFixed(1)
            return `${context.label}: ${context.parsed} (${percentage}%)`
          }
        }
      }
    }
  }

  return (
    <div className={`h-80 ${className}`}>
      <Doughnut data={chartData} options={options} />
    </div>
  )
}

export const DepartmentPerformanceChart: React.FC<ChartProps> = ({ data, className = '' }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Total Assigned',
        data: data.totalAssigned,
        backgroundColor: `${culturalColors.primary}80`,
        borderColor: culturalColors.primary,
        borderWidth: 1
      },
      {
        label: 'Resolved',
        data: data.resolved,
        backgroundColor: `${culturalColors.success}80`,
        borderColor: culturalColors.success,
        borderWidth: 1
      },
      {
        label: 'Pending',
        data: data.pending,
        backgroundColor: `${culturalColors.warning}80`,
        borderColor: culturalColors.warning,
        borderWidth: 1
      }
    ]
  }

  return (
    <div className={`h-80 ${className}`}>
      <Bar data={chartData} options={defaultOptions} />
    </div>
  )
}

export const SatisfactionRadarChart: React.FC<ChartProps> = ({ data, className = '' }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Satisfaction Score',
        data: data.values,
        backgroundColor: `${culturalColors.primary}20`,
        borderColor: culturalColors.primary,
        borderWidth: 2,
        pointBackgroundColor: culturalColors.primary,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 8,
        padding: 12
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
          font: {
            size: 10
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  }

  return (
    <div className={`h-80 ${className}`}>
      <Radar data={chartData} options={options} />
    </div>
  )
}

export const ResolutionTimeChart: React.FC<ChartProps> = ({ data, className = '' }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Average Resolution Time (days)',
        data: data.values,
        backgroundColor: data.values.map((value: number) => {
          if (value <= 3) return `${culturalColors.success}80`
          if (value <= 7) return `${culturalColors.warning}80`
          return `${culturalColors.error}80`
        }),
        borderColor: data.values.map((value: number) => {
          if (value <= 3) return culturalColors.success
          if (value <= 7) return culturalColors.warning
          return culturalColors.error
        }),
        borderWidth: 1
      }
    ]
  }

  return (
    <div className={`h-80 ${className}`}>
      <Bar data={chartData} options={defaultOptions} />
    </div>
  )
}