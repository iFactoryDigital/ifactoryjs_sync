
// Require helper
const helper = require('helper');

/**
 * Create model helper
 *
 * @extends helper
 */
class ModelHelper extends helper {
  /**
   * Construct model helper
   */
  constructor() {
    // Run super
    super();

    // Bind methods
    this.deafen = this.deafen.bind(this);
    this.listen = this.listen.bind(this);
  }

  /**
   * Live listens to model
   *
   * @param  {String}  sessionID
   * @param  {*}       listenModel
   * @param  {String}  listenID
   *
   * @returns {Promise}
   */
  deafen(sessionID, listenModel, listenID) {
    // check model
    if (!listenModel || !listenModel.get('_id')) return;

    // Call local
    return this.eden.thread(['back', 'model']).call('model.deafen', sessionID, listenModel.constructor.name.toLowerCase(), listenModel.get('_id').toString(), listenID);
  }

  /**
   * Live listens to model
   *
   * @param  {String}  sessionID
   * @param  {*}       listenModel
   * @param  {String}  listenID
   * @param  {Boolean} atomic
   *
   * @returns {Promise}
   */
  listen(sessionID, listenModel, listenID, atomic = false) {
    // check model
    if (!listenModel || !listenModel.get('_id')) return;

    // Call local
    return this.eden.thread(['back', 'model']).call('model.listen', sessionID, listenModel.constructor.name.toLowerCase(), listenModel.get('_id').toString(), listenID, atomic);
  }
}

/**
 * Export model helper
 *
 * @type {ModelHelper}
 */
module.exports = new ModelHelper();
