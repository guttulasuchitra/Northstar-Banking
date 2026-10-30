
pipeline {
    agent any

    stages {
        stage('Git Checkout') {
            steps {
                echo 'Northstar Banking SCM Pipeline'
                checkout scm
            }
        }

        stage('Check Tools') {
            steps {
                sh 'java -version'
                sh 'mvn -version'
                sh 'docker --version'
                sh 'docker info'
            }
        }

        stage('Build Backend') {
            steps {
                sh 'mvn clean package -DskipTests'
            }
        }
    }

    post {
        success {
            echo 'SCM Pipeline Successful!'
        }
        failure {
            echo 'SCM Pipeline Failed!'
        }
    }
}
