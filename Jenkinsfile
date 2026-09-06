pipeline {
    agent any

    tools {
        nodejs 'NodeJS-22'
    }

    stages {
        stage('Environment') {
            steps {
                sh '''
                    echo "Node: $(node --version)"
                    echo "NPM:  $(npm --version)"
                '''
            }
        }

        stage('Backend') {
            stages {
                stage('Install') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }

                stage('Test') {
                    steps {
                        dir('backend') {
                            sh 'npm test'
                        }
                    }
                }

                stage('Build') {
                    steps {
                        dir('backend') {
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Frontend') {
            stages {
                stage('Install') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }

                stage('Build') {
                    steps {
                        dir('frontend') {
                            sh 'npm run build'
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'All applications built successfully.'
        }

        failure {
            echo 'One or more applications failed.'
        }
    }
}