const ping = require('ping');

const HOSTS = ['1.1.1.1', '8.8.8.8'];

/**
 * Check connectivity by pinging DNS servers.
 * Returns true if at least one host responds.
 */
async function checkConnectivity() {
  const results = await Promise.all(
    HOSTS.map(host => ping.promise.probe(host, { timeout: 2 }))
  );
  return results.some(result => result.alive);
}

module.exports = { checkConnectivity };
