
// require uuid
const uuid = require('uuid');

// Require live model
const EdenModel = require('model/public/js/model');

// create model mixin
module.exports = (mixIn) => {
  // set of models
  mixIn.__uuid = uuid();
  mixIn.__models = new Map();

  // unmount
  mixIn.on('unmount', () => {
    // Create model
    if (!mixIn.eden.frontend) return;

    // loop models
    for (const [key, value] of mixIn.__models) {
      // remove view listner
      value.listener.remove(mixIn.__uuid);

      // On update
      value.removeListener('update', mixIn.update);

      // remove model
      mixIn.__models.delete(key);
    }
  });

  // create model function
  mixIn.model = (type, object) => {
    // check uuid
    if (!mixIn.__uuid) mixIn.__uuid = uuid();

    // Create model
    if (!mixIn.eden.frontend) {
      // create model
      const model = new EdenModel(type, object.id, object);

      // Return model
      return model;
    }

    // return model
    const model = eden.model.add(type, object.id, object, mixIn.__uuid);

    // add to models
    mixIn.__models.set(`${type}.${object.id}`, model);

    // On update
    model.on('update', mixIn.update);

    // Return model
    return model;
  };
};