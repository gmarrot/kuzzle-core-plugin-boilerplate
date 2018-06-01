const
  {
    BeforeAll,
    After
  } = require('cucumber'),
  Kuzzle = require('kuzzle-sdk'),
  KWorld = require('./world'),
  {
    spawnSync
  } = require('child_process');

BeforeAll(function(callback) {
  let maxTries = 10;
  let connected = false;
  let curl;

  const world = new KWorld();

  while (! connected && maxTries > 0) {
    curl = spawnSync('curl', [`${world.host}:${world.port}`]);

    if (curl.status == 0) {
      connected = true;
    } else {
      console.log(`[${maxTries}] Waiting for kuzzle..`);
      maxTries -= 1;
      spawnSync('sleep', ['5']);
    }
  }

  if (! connected) {
    callback(new Error("Unable to start docker-compose stack"));
  }

  const kuzzle = new Kuzzle(world.host, { port: world.port }, (error, result) => {
    if (error) {
      callback(error);
    }

    kuzzle
      .collection('test-collection', 'test-index')
      .truncatePromise()
      .then(() => callback())
      .catch(err => callback(err))
      .finally(() => kuzzle.disconnect());
  })

  After(function (callback) {
    if (this.kuzzle && typeof this.kuzzle.disconnect == 'function') {
      this.kuzzle.disconnect();
    }
  });
});
