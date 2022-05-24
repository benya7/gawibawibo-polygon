
function getConfig(env) {
  switch (env) {
    case 'development':
    case 'Polygon':
      return {
        contractHash: '0xbe3D99236577977D44D5A65Ce0b34a25a6E31c81',
      };
    case 'Mumbai':
      return {
        contractHash: '0xff59066A56B7900A8323f205794d95fB9117B834',
      };
    default:
      throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`);
  }
}

module.exports = getConfig;