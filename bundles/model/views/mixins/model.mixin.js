

// Create mixin
riot.mixin('model', {
  /**
   * On init function
   */
  init() {
    // require uuid
    const uuid = require('uuid');

    // set of models
    this.__uuid = uuid();
    this.__models = new Map();

    // unmount
    this.on('unmount', () => {
      // Create model
      if (!this.eden.frontend) return;

      // loop models
      for (const [key, value] of this.__models) {
        // remove view listner
        value.listener.remove(this.__uuid);

        // On update
        value.removeListener('update', this.update);

        // remove model
        this.__models.delete(key);
      }
    });
  },

  /**
   * Creates live model
   *
   * @param  {String} type
   * @param  {Object} object
   *
   * @return {FEModel}
   */
  model(type, object) {
    // require uuid
    const uuid = require('uuid');

    // Require live model
    const EdenModel = require('model/public/js/model');

    // check uuid
    if (!this.__uuid) this.__uuid = uuid();

    // Create model
    if (!this.eden.frontend) {
      // create model
      const model = new EdenModel(type, object.id, object);

      // Return model
      return model;
    }

    // return model
    const model = eden.model.add(type, object.id, object, this.__uuid);

    // add to models
    this.__models.set(`${type}.${object.id}`, model);

    // On update
    model.on('update', this.update);

    // Return model
    return model;
  },
});
