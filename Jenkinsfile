#!groovy

def envFlag = 'none'
def mainbranch = 'vant/deploy'
pipeline {
    agent {
        label 'Cloud-Agent' // Please run this job on master agent
    }

    environment {
        DISABLE_AUTH = 'true'
        DB_ENGINE = 'sqlite'

        // Assuming a file credential has been added to Jenkins, with the ID 'my-app-signing-keystore',
        // this will export an environment variable during the build, pointing to the absolute path of
        // the stored Android keystore file.  When the build ends, the temporarily file will be removed.
        FIREBASE_SERVICES = credentials('abcpay_android_firebase_services')
        SIGNING_KEYSTORE = credentials('abcpay_keystore_staging')

        // Similarly, the value of this variable will be a password stored by the Credentials Plugin
        SIGNING_KEY_ALIAS = credentials('abcpay_android_keystore_alias')
        KEY_PASSWORD = credentials('abcpay_android_keystore_password')
        FIREBASE_CI_TOKEN = credentials('abcpay_android_firebase_token')
    }
    stages {
        stage('Check-Branch') {
            steps {
                sh 'printenv'
                echo "Target branch :  ${env.gitlabTargetBranch}"
                echo "Action Type :  ${env.gitlabActionType}"

                script {
                    if ( (env.gitlabTargetBranch != mainbranch) && (env.gitlabActionType == 'PUSH' || env.gitlabActionType == 'MERGE')) {
                        envFlag = 'dev'
                    } else if (env.gitlabActionType == 'TAG_PUSH') {
                        echo 'matching staging or production'
                        if(env.gitlabTargetBranch ==~ /^(.*)tags\/release_staging$/){
                            envFlag = 'stg'
                        } else if(env.gitlabTargetBranch ==~ /^(.*)tags\/release_production$/){
                            envFlag = 'prod'
                        }
                    }

                    echo 'matched ${envFlag}'

                    if (envFlag == 'none') {
                        echo "Doesn't match condition"
                        currentBuild.result = 'ABORTED'
                        error("Aborting the job.")
//                        sh "exit "
                    }
                }

            }
        }
        stage('Clone repos') {
            steps {
                // script {
                //     if (fileExists('./abcpay'))
                //     {
                //         sh 'rm -r abcpay'
                //         //
                //     }
                // }
                // sh 'git clone https://gitlab.com/abcpros/abcpay.git'
                // dir('abcpay'){
                //     sh 'git checkout vant/deploy'
                // }
                // sh 'echo $(pwd)'
                // sh 'echo $(ls)'
                // sh 'echo $(ls abcpay/)'


                checkout([
                        $class                           : 'GitSCM',
                        branches                         : [[name: "${env.gitlabTargetBranch}"]],
                        doGenerateSubmoduleConfigurations: false,
                        //extensions : [[$class: 'CleanBeforeCheckout']],
                        submoduleCfg                     : [],
                        userRemoteConfigs                : [[credentialsId: 'GitLab_Abc', url: 'https://gitlab.com/abcpros/abcpay.git']]
                ])
            }
        }
        stage('Android Build') {
            agent {
                dockerfile {
                    filename 'Dockerfile'
                    // dir 'abcpay'
                    additionalBuildArgs '--build-arg version=28.0.3'
                    args '-v $PWD:/usr/src/app/ -u 0:0'
                    // args '-v /home/jenkins/.ssh:/home/jenkins/.ssh:ro -u 0'
                    reuseNode true
                }
            }

//            when {
//                expression {
//                    GIT_BRANCH = 'origin/' + sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
//                    return GIT_BRANCH == 'origin/master' || params.FORCE_FULL_BUILD
//                }
//            }

            steps {
                // dir('abcpay') {
                sh 'echo $(pwd)'
                sh 'echo $(ls)'
                sh 'npm ci'

                sh 'npm run prepare:android'
                sh 'chmod -R 777 ./'

                sh 'mkdir src/environments'
                sh 'echo > src/environments/index.ts'
                sh 'chmod 777 src/environments/index.ts'


                sh 'cp $FIREBASE_SERVICES .'
                sh 'cp build-extras.gradle platforms/android/'

                sh 'npm run fcm:android'
                sh 'npm run patch:bwc'
                sh 'npm run final:android-apk'
                sh 'echo $(ls platforms/android/app/build/outputs/apk/release)'

                sh 'chmod -R 777 ./'
                sh 'echo ${ANDROID_HOME}'

                sh '${ANDROID_HOME}/build-tools/28.0.3/apksigner sign -v --ks ${SIGNING_KEYSTORE} --ks-key-alias $SIGNING_KEY_ALIAS --ks-pass pass:"${KEY_PASSWORD}" --key-pass pass:"${KEY_PASSWORD}" --out app-stg-release.apk platforms/android/app/build/outputs/apk/release/android-release-aligned-unsigned.apk'

                // }
            }
            post {
                always {
                    sh 'npm run clean-all'
                }
            }
        }
        stage('Publish') {
            parallel {
                stage('deploying dev') {
                    when {
                        expression {
                            return envFlag == 'dev'
                        }
                    }
                    steps {
                        withCredentials([string(credentialsId: 'abcpay_firebase_id_dev', variable: 'FIREBASE_PROJECT_ID')]) {
                            sh 'firebase appdistribution:distribute app-stg-release.apk --app $FIREBASE_PROJECT_ID --groups "AbcPayCore" --token "$FIREBASE_CI_TOKEN"'
                        }
                    }

                }
                stage('deploying staging') {
                    when {
                        expression {
                            return envFlag == 'stg'
                        }
                    }
                    steps {
                        withCredentials([string(credentialsId: 'abcpay_firebase_id_staging', variable: 'FIREBASE_PROJECT_ID')]) {
                            sh 'firebase appdistribution:distribute app-stg-release.apk --app $FIREBASE_PROJECT_ID --groups "AbcPayCore" --token "$FIREBASE_CI_TOKEN"'
                        }
                    }
                }
                stage('deploying production') {
                    when {
                        expression {
                            return envFlag == 'prod'
                        }
                    }
                    steps {
                        withCredentials([string(credentialsId: 'abcpay_firebase_id_prod', variable: 'FIREBASE_PROJECT_ID')]) {
                            sh 'firebase appdistribution:distribute app-stg-release.apk --app $FIREBASE_PROJECT_ID --groups "AbcPayCore" --token "$FIREBASE_CI_TOKEN"'
                        }
                    }
                }
            }
        }

    }
}
