#/bin/bash

PROJECT=./cordova/project/platforms
for i in $PROJECT/wp8/www/img/*.svg
do
    cat $i |grep -v ?xml > $i
done

for i in $PROJECT/wp8/www/font/*.svg
do
    cat $i |grep -v ?xml > $i
done