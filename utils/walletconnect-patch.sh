sed -i -e 's/readonly/\/\/@ts-ignore\
readonly/g;s/[[:space:]]get/\/\/@ts-ignore\
get/g;s/[[:space:]]set/\/\/@ts-ignore\
set/g' ./node_modules/@walletconnect/core/dist/cjs/index.d.ts;
sed -i -e 's/import("detect-browser").OperatingSystem | NodeJS.Platform | undefined*/any/g' ./node_modules/@walletconnect/browser-utils/dist/cjs/browser.d.ts;
sed -i -e 's/extends Required<RequestArguments<T>>//g' ./node_modules/@walletconnect/jsonrpc-types/dist/cjs/jsonrpc.d.ts;
sed -i -e 's/readonly/\/\/@ts-ignore\
readonly/g' ./node_modules/detect-browser/index.d.ts