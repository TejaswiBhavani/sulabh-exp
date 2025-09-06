pipeline {
    agent any
    environment {
        NODE_ENV = 'production'
        REACT_APP_API_BASE_URL = 'https://api.grievance.gov'
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci --prefer-offline'
                stash name: 'node_modules', includes: 'node_modules/**'
            }
        }

        stage('Test & Lint') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'npm run test -- --run --coverage'
                    }
                }
                stage('Code Quality') {
                    steps {
                        sh 'npm run lint'
                    }
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
                archiveArtifacts artifacts: 'dist/**/*'
            }
        }

        stage('Security Scan') {
            steps {
                sh 'npm audit --production'
                sh 'npx sbom-cyclonedx .'
            }
        }

        stage('Dockerize') {
            steps {
                script {
                    docker.build("grievance-ui:${env.BUILD_ID}")
                    docker.withRegistry('https://your-registry.com', 'docker-creds') {
                        docker.image("grievance-ui:${env.BUILD_ID}").push()
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
            script {
                currentBuild.description = "React ${env.BUILD_ID} | ${env.NODE_ENV}"
            }
        }
        success {
            slackSend(
                channel: '#citizen-portal',
                message: ":white_check_mark: Grievance UI v${env.BUILD_ID} deployed\n${env.BUILD_URL}"
            )
        }
        failure {
            mail(
                to: 'dev-team@municipal.gov',
                subject: "Grievance UI Build Failed (#${env.BUILD_NUMBER})",
                body: "Investigate: ${env.BUILD_URL}"
            )
        }
    }
}
