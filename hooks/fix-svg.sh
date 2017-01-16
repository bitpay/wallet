#/bin/bash
shopt -s globstar
PROJECT=./platforms
for i in $PROJECT/wp8/www/img/**/*.svg
do
    cat $i |grep -v ?xml > $i
done

for i in $PROJECT/wp8/www/fonts/*.svg
do
    cat $i |grep -v ?xml > $i
done
