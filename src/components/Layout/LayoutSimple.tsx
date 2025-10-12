import React from 'react'
import HeaderSimple from './HeaderSimple'
import FooterSimple from './FooterSimple'

interface LayoutProps {
  children: React.ReactNode
}

const LayoutSimple: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <HeaderSimple />
      <main className="flex-1">
        {children}
      </main>
      <FooterSimple />
    </div>
  )
}

export default LayoutSimple