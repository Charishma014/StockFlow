pipeline {
    agent any

    environment {
        JAVA_HOME = tool name: 'JDK-21', type: 'jdk'
        MAVEN_HOME = tool name: 'Maven-3', type: 'maven'
        NODE_HOME = tool name: 'NodeJS-22', type: 'nodejs'
        PATH = "${env.JAVA_HOME}/bin:${env.MAVEN_HOME}/bin:${env.NODE_HOME}/bin:${env.PATH}"
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend'
        IMAGE_BACKEND = 'stockflow-backend:latest'
        IMAGE_FRONTEND = 'stockflow-frontend:latest'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '5'))
        ansiColor('xterm')
    }

    stages {
        stage('Checkout Source') {
            steps {
                echo '=== Stage 1: Checking out source code from Git ==='
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                echo '=== Stage 2: Compiling Spring Boot Backend ==='
                dir("${env.BACKEND_DIR}") {
                    // Windows agent checks for mvnw.cmd, Linux agent checks for ./mvnw
                    script {
                        if (isUnix()) {
                            sh 'chmod +x ./mvnw || true'
                            sh './mvnw clean compile -DskipTests'
                        } else {
                            bat 'mvnw.cmd clean compile -DskipTests'
                        }
                    }
                }
            }
        }

        stage('Run Backend Tests') {
            steps {
                echo '=== Stage 3: Running Automated JUnit & Integration Tests ==='
                dir("${env.BACKEND_DIR}") {
                    script {
                        if (isUnix()) {
                            sh './mvnw test'
                        } else {
                            bat 'mvnw.cmd test'
                        }
                    }
                }
            }
            post {
                always {
                    junit testResults: 'backend/target/surefire-reports/*.xml', allowEmptyResults: true
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                echo '=== Stage 4: Installing Frontend NPM Dependencies ==='
                dir("${env.FRONTEND_DIR}") {
                    script {
                        if (isUnix()) {
                            sh 'npm ci || npm install'
                        } else {
                            bat 'npm ci || npm install'
                        }
                    }
                }
            }
        }

        stage('Build React Frontend') {
            steps {
                echo '=== Stage 5: Building React + Vite Production Bundle ==='
                dir("${env.FRONTEND_DIR}") {
                    script {
                        if (isUnix()) {
                            sh 'npm run build'
                        } else {
                            bat 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                echo '=== Stage 6: Building Container Images for Backend and Frontend ==='
                script {
                    if (isUnix()) {
                        sh "docker build -t ${IMAGE_BACKEND} ./${BACKEND_DIR}"
                        sh "docker build -t ${IMAGE_FRONTEND} ./${FRONTEND_DIR}"
                    } else {
                        bat "docker build -t ${IMAGE_BACKEND} ./${BACKEND_DIR}"
                        bat "docker build -t ${IMAGE_FRONTEND} ./${FRONTEND_DIR}"
                    }
                }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                echo '=== Stage 7: Starting / Updating Stack with Docker Compose ==='
                script {
                    if (isUnix()) {
                        sh 'docker compose up -d --remove-orphans'
                    } else {
                        bat 'docker compose up -d --remove-orphans'
                    }
                }
            }
        }
    }

    post {
        success {
            echo '====================================================='
            echo '  StockFlow CI/CD Pipeline Completed Successfully!  '
            echo '  Backend & Frontend built, tested, and containerized.'
            echo '====================================================='
        }
        failure {
            echo '====================================================='
            echo '  Pipeline failed! Please check the stage logs above.'
            echo '====================================================='
        }
        always {
            cleanWs deleteDirs: false, notFailBuild: true
        }
    }
}
