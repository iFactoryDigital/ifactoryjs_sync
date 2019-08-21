// Require dependencies
const Events = require('events');

// require local dependencies
const EdenModel = require('./model');

/**
 * Create live model class
 *
 * @extends events
 */
class ModelStore extends Events {
  /**
   * Construct model class
   *
   * @param {String} type
   * @param {Object} object
   */
  constructor() {
    // Run super
    super();

    // set variables
    this.__models = new Map();

    // Build
    this.get = this.get.bind(this);
  }


  /**
   * gets eden frontend live model
   *
   * @param  {String} type
   * @param  {String} id
   * @param  {Object} opts
   *
   * @return {EdenModel}
   */
  get(type, id, opts) {
    // set model
    if (!this.__models.has(type)) {
      // multi-dimensional map
      this.__models.set(type, new Map());
    }

    // set id
    if (!id || !this.__models.get(type).has(id)) {
      // alter model
      this.__models.get(type).set(id, new EdenModel(type, id, opts || {}));

      // on remove
      this.__models.get(type).get(id).on('destroy', () => {
        // remove model
        this.__models.get(type).delete(id);
      });
    }

    // update model in place
    this.__models.get(type).get(id).setOpts(opts || {});

    // return model
    return this.__models.get(type).get(id);
  }

  /**
   * removes eden model
   *
   * @param  {String} type
   * @param  {String} id
   *
   * @return {*}
   */
  remove(type, id) {
    // set model
    if (!this.__models.has(type)) {
      // multi-dimensional map
      this.__models.set(type, new Map());
    }

    // set id
    if (!this.__models.get(type).has(id)) {
      // alter model
      this.__models.get(type).get(id).deafen();
      this.__models.get(type).delete(id);
    }

    // return removed
    return true;
  }
}

/**
 * Build alert class
 *
 * @type {edenAlert}
 */
const built = new ModelStore();

/**
 * Export locale store class
 *
 * @type {LocaleStore}
 */
module.exports = built;

/**
 * Add locale to window.eden
 */
window.eden.model = built;
