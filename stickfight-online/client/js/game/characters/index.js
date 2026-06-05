/**
 * Client character registry — maps id strings to instances.
 */
const CharacterRegistry = (() => {
  const registry = {};

  function register(CharClass) {
    const inst = new CharClass();
    registry[inst.id] = inst;
  }

  function get(id) { return registry[id] || registry['ryoku']; }
  function getAll()  { return Object.values(registry); }

  // Auto-register when all classes are loaded
  function init() {
    register(RyokuChar);
    register(SeraphChar);
    register(VortexChar);
    register(NyxChar);
    register(TitanChar);
  }

  return { register, get, getAll, init };
})();

window.CharacterRegistry = CharacterRegistry;
