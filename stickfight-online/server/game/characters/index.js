const Ryoku  = require('./Ryoku');
const Seraph = require('./Seraph');
const Vortex = require('./Vortex');
const Nyx    = require('./Nyx');
const Titan  = require('./Titan');

const registry = {
  ryoku:  new Ryoku(),
  seraph: new Seraph(),
  vortex: new Vortex(),
  nyx:    new Nyx(),
  titan:  new Titan(),
};

function getCharacter(id) {
  return registry[id] || registry['ryoku'];
}

function getAll() {
  return Object.values(registry);
}

module.exports = { getCharacter, getAll, registry };
