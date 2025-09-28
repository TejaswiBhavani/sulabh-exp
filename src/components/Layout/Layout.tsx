import React from 'react'
import Header from './Header'
import Footer from './Footer'
import SessionManager from '../Auth/SessionManager'
import { useAuth } from '../../contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth()
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {user && <SessionManager />}
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout