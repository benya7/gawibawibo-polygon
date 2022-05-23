
function getConfig(env) {
  switch (env) {
    case 'development':
    case 'Polygon':
      return {
        contractHash: '0x7A2236214a1AB8a220f60B58D7147F32ae5E8F58',
      };
    case 'Mumbai':
      return {
        contractHash: '0x7A2236214a1AB8a220f60B58D7147F32ae5E8F58',
      };
    default:
      throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`);
  }
}

module.exports = getConfig;