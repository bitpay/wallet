sed -i -e 's/readonly/\/\/@ts-ignore\
readonly/g;s/[[:space:]]get/\/\/@ts-ignore\
get/g;s/[[:space:]]set/\/\/@ts-ignore\
set/g' ./node_modules/@walletconnect/core/dist/cjs/index.d.ts;
sed -i -e 's/readonly/\/\/@ts-ignore\
readonly/g' ./node_modules/detect-browser/index.d.ts