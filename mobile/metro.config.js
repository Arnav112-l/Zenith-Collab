const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
const webcryptoShim = path.resolve(__dirname, 'src/shims/webcrypto.js')
const tslibCjs = path.resolve(__dirname, 'node_modules/tslib/tslib.js')

const previousResolveRequest = config.resolver.resolveRequest

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'isomorphic-webcrypto' ||
    moduleName === 'isomorphic-webcrypto/src/react-native' ||
    moduleName.startsWith('isomorphic-webcrypto/')
  ) {
    return { filePath: webcryptoShim, type: 'sourceFile' }
  }

  // Moti/framer-motion SSR: tslib ESM default export is undefined under Metro.
  if (moduleName === 'tslib') {
    return { filePath: tslibCjs, type: 'sourceFile' }
  }

  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform)
  }

  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
