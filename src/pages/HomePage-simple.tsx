import React from 'react'
import { Link } from 'react-router-dom'

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            SULABH
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Online Grievance Redressal System
          </p>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Easy and accessible platform for citizens to submit complaints and suggestions 
            to government authorities and track their progress.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Submit Complaint</h3>
            <p className="text-gray-600 mb-4">
              File your grievances and complaints easily online
            </p>
            <Link 
              to="/submit-complaint" 
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
            >
              Submit Now
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Track Status</h3>
            <p className="text-gray-600 mb-4">
              Monitor the progress of your submitted complaints
            </p>
            <Link 
              to="/track" 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Track Now
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">💡</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Share Ideas</h3>
            <p className="text-gray-600 mb-4">
              Contribute suggestions for improving public services
            </p>
            <Link 
              to="/submit-suggestion" 
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            >
              Suggest Now
            </Link>
          </div>
        </div>

        <div className="text-center mt-12">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Get Started</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/login" 
                className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage