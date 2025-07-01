pipeline {
    agent any

    environment {
        PYTHON_VERSION = '3.9'
        DJANGO_SETTINGS_MODULE = 'grievance.settings'
    }

    stages {
        stage('Setup Python') {
            steps {
                script {
                    bat "python --version"
                    bat "pip install virtualenv"
                    bat "virtualenv venv"
                    bat "call venv\\Scripts\\activate"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                bat "pip install -r requirements.txt"
            }
        }

        stage('Database Migrations') {
            steps {
                bat "python manage.py migrate"
            }
        }

        stage('Test') {
            steps {
                bat "python manage.py test"
            }
        }

        stage('Docker Build') {
            when {
                expression { fileExists('Dockerfile') }
            }
            steps {
                script {
                    docker.build("grievance-redressal:${env.BUILD_ID}")
                }
            }
        }
    }

    post {
        always {
            cleanWs()
            echo 'Pipeline completed'
        }
        success {
            slackSend channel: '#alerts', message: "Build ${env.BUILD_URL} succeeded"
        }
        failure {
            mail to: 'admin@example.com', subject: 'Pipeline Failed', body: "Check ${env.BUILD_URL}"
        }
    }
}
