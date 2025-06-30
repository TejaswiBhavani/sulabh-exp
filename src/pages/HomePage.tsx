import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  FileText, 
  Search, 
  BarChart3, 
  Shield, 
  Clock, 
  Globe, 
  CheckCircle,
  ArrowRight,
  Users,
  TrendingUp
} from 'lucide-react'

const HomePage: React.FC = () => {
  const { t } = useTranslation()

  const features = [
    {
      icon: FileText,
      title: t('home.features.easy.title'),
      description: t('home.features.easy.description')
    },
    {
      icon: Clock,
      title: t('home.features.track.title'),
      description: t('home.features.track.description')
    },
    {
      icon: Globe,
      title: t('home.features.multilingual.title'),
      description: t('home.features.multilingual.description')
    },
    {
      icon: Shield,
      title: t('home.features.secure.title'),
      description: t('home.features.secure.description')
    }
  ]

  const stats = [
    { label: 'Total Complaints Resolved', value: '12,847', icon: CheckCircle },
    { label: 'Active Users', value: '8,234', icon: Users },
    { label: 'Average Resolution Time', value: '3.2 days', icon: Clock },
    { label: 'Success Rate', value: '94%', icon: TrendingUp }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              {t('home.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-primary-100 animate-fade-in">
              {t('home.subtitle')}
            </p>
            <p className="text-lg mb-12 text-primary-200 max-w-3xl mx-auto animate-fade-in">
              {t('home.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
              <Link
                to="/submit-complaint"
                className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>{t('home.submitComplaint')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/track"
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
              >
                <Search className="w-5 h-5" />
                <span>{t('home.trackComplaint')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                <stat.icon className="w-8 h-8 text-primary-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Designed with citizens in mind, SULABH provides a comprehensive platform for grievance management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Submit Your Complaint?
          </h2>
          <p className="text-xl mb-8 text-secondary-100 max-w-2xl mx-auto">
            Join thousands of citizens who have successfully resolved their grievances through SULABH
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-secondary-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Get Started Today
            </Link>
            <Link
              to="/track"
              className="border-2 border-white text-white hover:bg-white hover:text-secondary-600 font-semibold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <BarChart3 className="w-5 h-5 inline mr-2" />
              {t('home.publicDashboard')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage