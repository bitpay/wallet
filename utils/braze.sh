#!/bin/bash
if [ -f ./app-template/braze.xml ]
then
    cp ./app-template/braze.xml ./platforms/android/app/src/main/res/values/
    echo "BrazeXML successfully moved to platforms src"
else
    echo "BrazeXML does not exists"
fi
