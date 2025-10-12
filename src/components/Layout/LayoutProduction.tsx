import React from 'react'
import HeaderProduction from './HeaderProduction'
import FooterSimple from './FooterSimple'

interface LayoutProps {
  children: React.ReactNode
}

const LayoutProduction: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <HeaderProduction />
      <main className="flex-1">
        {children}
      </main>
      <FooterSimple />
    </div>
  )
}

export default LayoutProduction