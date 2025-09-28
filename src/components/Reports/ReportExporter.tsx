import React from 'react'
import { Download, FileText, Table } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'

interface ReportExporterProps {
  data: any[]
  reportType: string
  title: string
  columns?: { key: string; label: string }[]
  chartRef?: React.RefObject<HTMLDivElement>
  className?: string
}

const ReportExporter: React.FC<ReportExporterProps> = ({
  data,
  reportType,
  title,
  columns,
  chartRef,
  className = ''
}) => {
  const exportToPDF = async () => {
    const pdf = new jsPDF()
    
    // Add header
    pdf.setFontSize(20)
    pdf.setTextColor(234, 88, 12) // Primary color
    pdf.text('SULABH - Online Grievance Redressal System', 20, 20)
    
    pdf.setFontSize(16)
    pdf.setTextColor(0, 0, 0)
    pdf.text(title, 20, 35)
    
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45)
    
    let yPosition = 60

    // Add chart if available
    if (chartRef?.current) {
      try {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2
        })
        const imgData = canvas.toDataURL('image/png')
        const imgWidth = 170
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        
        pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight)
        yPosition += imgHeight + 20
      } catch (error) {
        console.error('Error capturing chart:', error)
      }
    }

    // Add table data
    if (data.length > 0 && columns) {
      const tableColumns = columns.map(col => col.label)
      const tableRows = data.map(item => 
        columns.map(col => {
          const value = item[col.key]
          if (value instanceof Date) {
            return value.toLocaleDateString()
          }
          return String(value || '')
        })
      )

      autoTable(pdf, {
        head: [tableColumns],
        body: tableRows,
        startY: yPosition,
        styles: {
          fontSize: 8,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [234, 88, 12],
          textColor: [255, 255, 255]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      })
    }

    // Add footer
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)
      pdf.text(
        `Page ${i} of ${pageCount} | SULABH Report - ${reportType}`,
        20,
        pdf.internal.pageSize.height - 10
      )
    }

    pdf.save(`${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const exportToExcel = () => {
    if (data.length === 0) return

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    
    // Add title row
    XLSX.utils.sheet_add_aoa(worksheet, [[title]], { origin: 'A1' })
    XLSX.utils.sheet_add_aoa(worksheet, [[`Generated on: ${new Date().toLocaleDateString()}`]], { origin: 'A2' })
    
    // Adjust data starting position
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    range.s.r = 3 // Start data from row 4
    worksheet['!ref'] = XLSX.utils.encode_range(range)

    XLSX.utils.book_append_sheet(workbook, worksheet, reportType)
    XLSX.writeFile(workbook, `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportToCSV = () => {
    if (data.length === 0) return

    const headers = columns ? columns.map(col => col.label).join(',') : Object.keys(data[0]).join(',')
    const csvContent = [
      `"${title}"`,
      `"Generated on: ${new Date().toLocaleDateString()}"`,
      '',
      headers,
      ...data.map(item => {
        if (columns) {
          return columns.map(col => {
            const value = item[col.key]
            if (value instanceof Date) {
              return `"${value.toLocaleDateString()}"`
            }
            return `"${String(value || '')}"`
          }).join(',')
        }
        return Object.values(item).map(value => `"${String(value || '')}"`).join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={exportToPDF}
        className="btn-outline flex items-center space-x-2 text-sm"
        title="Export as PDF"
      >
        <FileText className="w-4 h-4" />
        <span>PDF</span>
      </button>
      
      <button
        onClick={exportToExcel}
        className="btn-outline flex items-center space-x-2 text-sm"
        title="Export as Excel"
      >
        <Table className="w-4 h-4" />
        <span>Excel</span>
      </button>
      
      <button
        onClick={exportToCSV}
        className="btn-outline flex items-center space-x-2 text-sm"
        title="Export as CSV"
      >
        <Download className="w-4 h-4" />
        <span>CSV</span>
      </button>
    </div>
  )
}

export default ReportExporter