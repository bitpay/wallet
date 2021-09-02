#!groovy
pipeline {
    agent {
        label 'Cloud-Agent' // Please run this job on master agent
    }
    stages {
        stage('Check-Branch') {
            steps {
                sh 'printenv'
                echo "Target branch :  ${env.gitlabTargetBranch}"
                echo "Action Type :  ${env.gitlabActionType}"

                script {
                    if (env.gitlabTargetBranch != 'vant/deploy' || env.gitlabActionType != 'PUSH') {
                        echo "Doesn't match condition"
                        currentBuild.result = 'ABORTED'
                        error("Aborting the job.")
                    }
                }

            }
        }
        stage('Clone repos'){
//            when {
//                expression{
//                    return env.gitlabTargetBranch == 'vant/deploy' && env.gitlabActionType == 'PUSH'
//                }
//                beforeAgent true
//            }
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
                        $class : 'GitSCM',
                        branches : [[name: "${env.gitlabTargetBranch}"]],
                        doGenerateSubmoduleConfigurations: false,
                        //extensions : [[$class: 'CleanBeforeCheckout']],
                        submoduleCfg : [],
                        userRemoteConfigs: [[credentialsId: 'GitLab_Abc', url: 'https://gitlab.com/abcpros/abcpay.git']]
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


            environment {
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
            steps {
                // dir('abcpay') {
                sh 'echo $(pwd)'
                sh 'echo $(ls)'
                sh 'npm ci'
                sh 'mkdir src/environments'
                sh 'echo > src/environments/index.ts'
                sh 'chmod 777 src/environments/index.ts'


                sh 'npm run prepare:android'
                sh 'chmod -R 777 platforms/'
                sh 'cp $FIREBASE_SERVICES .'
                sh 'cp build-extras.gradle platforms/android/'

                sh 'npm run fcm:android'
                sh 'npm run patch:bwc'
                sh 'npm run final:android-apk'
                sh 'echo $(ls platforms/android/app/build/outputs/apk/release)'

                sh 'chmod -R 777 ./'
                sh 'echo ${ANDROID_HOME}'

                sh '${ANDROID_HOME}/build-tools/28.0.3/apksigner sign -v --ks ${SIGNING_KEYSTORE} --ks-key-alias $SIGNING_KEY_ALIAS --ks-pass pass:"${KEY_PASSWORD}" --key-pass pass:"${KEY_PASSWORD}" --out app-stg-release.apk platforms/android/app/build/outputs/apk/release/android-release-aligned-unsigned.apk'
                sh 'firebase appdistribution:distribute app-stg-release.apk --app 1:894530348918:android:578df2699d46141474bc57 --groups "AbcPayCore" --token "$FIREBASE_CI_TOKEN"'
                sh 'npm run clean-all'
                // }
            }
        }

    }
}
