`sudo apt-get install default-jre`

#### Download android studio and install 'google play services' in SDK manager, along with at least one android SDK

`vi ~/.profile` (or .bash_profile) and add:
```ANDROID_HOME="/home/dave/Android/Sdk"
ANDROID_PLATFORM_TOOLS="/home/dave/Android/sdk/platform-tools"
PATH=${PATH}:$ANDROID_HOME/tools:$ANDROID_PLATFORM_TOOLS```
`source ~/.profile` (or .bash_profile)

```
git clone git@github.com/bitlox/bitcore-lib
cd bitcore-lib
git fetch && git checkout bitlox-main
npm link
cd ..

git clone git@github.com/bitlox/bitcore-wallet-service
cd bitcore-wallet-service
git fetch && git checkout networktest
npm link bitcore-lib && npm link
cd ..

git clone git@github.com/bitlox/bitcore-wallet-client
cd bitcore-wallet-client
git fetch && git checkout customnet
npm link bitcore-wallet-service && npm link
cd ..

git clone git@github.com/bitlox/copay
cd copay
git checkout <somebranch>
npm run apply:bitlox
npm run apply:bitlox // yes do it twice
cd chrome-app && npm run build:www-release && make
npm run start:android
```
