pipeline {
    agent any

    environment {
        PATH = "/usr/bin:/usr/local/bin:${env.PATH}"
        SCANNER_HOME = tool 'sonar-scanner'
        KUBECONFIG = "/var/lib/jenkins/.kube/config"
    }

    options {
        timestamps()
    }

    stages {

        stage('Clean Workspace') {
            steps {
                deleteDir()
            }
        }

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                url: 'https://github.com/Nareshgundavelli/react-js-cicd-automation.git'
            }
        }

        stage('Debug Files') {
            steps {
                sh '''
                echo "Current Path:"
                pwd

                echo "Workspace Files:"
                ls -la

                echo "YAML Files:"
                find . -name "*.yaml" || true
                '''
            }
        }

        stage('Detect Project') {
            steps {
                script {
                    env.FRONTEND_DIR = fileExists('frontend') ? 'frontend' : '.'
                    env.BACKEND_DIR  = fileExists('backend') ? 'backend' : '.'

                    echo "Frontend Directory: ${env.FRONTEND_DIR}"
                    echo "Backend Directory : ${env.BACKEND_DIR}"
                }
            }
        }

        stage('Install Dependencies') {
            parallel {

                stage('Frontend Install') {
                    steps {
                        dir("${env.FRONTEND_DIR}") {
                            sh 'npm install'
                        }
                    }
                }

                stage('Backend Install') {
                    steps {
                        dir("${env.BACKEND_DIR}") {
                            sh 'npm install'
                        }
                    }
                }

            }
        }

        stage('Wait For SonarQube') {
            steps {
                sh '''
                for i in {1..30}; do
                  curl -s http://localhost:9000 >/dev/null && exit 0
                  echo "Waiting for SonarQube..."
                  sleep 10
                done
                echo "SonarQube not reachable"
                exit 1
                '''
            }
        }

        stage('SonarQube Scan') {
            steps {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh '''
                    $SCANNER_HOME/bin/sonar-scanner \
                      -Dsonar.projectKey=dynamic-app \
                      -Dsonar.projectName=dynamic-app \
                      -Dsonar.sources=. \
                      -Dsonar.host.url=http://localhost:9000 \
                      -Dsonar.token=$SONAR_TOKEN
                    '''
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                sh 'trivy fs . || true'
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                docker build -t frontend-app:latest -f ${FRONTEND_DIR}/Dockerfile ${FRONTEND_DIR}
                docker build -t backend-app:latest -f ${BACKEND_DIR}/Dockerfile ${BACKEND_DIR}
                '''
            }
        }

        stage('Import Images to K3s') {
            steps {
                sh '''
                docker save frontend-app:latest -o frontend.tar
                docker save backend-app:latest -o backend.tar

                sudo -n /usr/local/bin/k3s ctr images import frontend.tar
                sudo -n /usr/local/bin/k3s ctr images import backend.tar
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                export KUBECONFIG=/var/lib/jenkins/.kube/config

                echo "Checking Cluster..."
                kubectl get nodes

                echo "Deploying Postgres..."
                kubectl apply -f k8s/postgres.yaml --validate=false

                echo "Deploying Backend..."
                kubectl apply -f k8s/backend.yaml --validate=false

                echo "Deploying Frontend..."
                kubectl apply -f k8s/frontend.yaml --validate=false

                echo "Restarting Deployments..."
                kubectl rollout restart deployment backend || true
                kubectl rollout restart deployment frontend || true

                echo "Waiting for Rollout..."
                kubectl rollout status deployment/backend --timeout=180s
                kubectl rollout status deployment/frontend --timeout=180s
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                export KUBECONFIG=/var/lib/jenkins/.kube/config

                echo "Pods:"
                kubectl get pods -o wide

                echo "Services:"
                kubectl get svc

                echo "Backend Health:"
                curl -s http://localhost:30051/health || true
                '''
            }
        }
    }

    post {
        success {
            echo '✅ PIPELINE SUCCESS'
            echo 'Frontend URL: http://YOUR_PUBLIC_IP:30001'
            echo 'Backend URL : http://YOUR_PUBLIC_IP:30051/health'
        }

        failure {
            echo '❌ PIPELINE FAILED'
        }

        always {
            cleanWs()
        }
    }
}

