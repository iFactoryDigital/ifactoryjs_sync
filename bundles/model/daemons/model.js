// Require daemon
const Daemon = require('daemon');

// Require helpers
const socket = helper('socket');

/**
 * Create live daemon
 *
 * @cluster back
 * @cluster model
 *
 * @extends daemon
 */
class ModelDaemon extends Daemon {
  /**
   * Constructor
   */
  constructor(...args) {
    // Run arguments
    super(...args);

    // Bind build
    this.build = this.build.bind(this);
    this.models = new Map();

    // Bind private methods
    this.onSave = this.onSave.bind(this);
    this.onSubscribe = this.onSubscribe.bind(this);
    this.onUnsubscribe = this.onUnsubscribe.bind(this);

    // Bind building
    this.building = this.build();
  }

  /**
   * Build live daemon
   */
  build() {
    // Add endpoint for listen
    this.eden.endpoint('model.listen', this.onSubscribe, true);
    this.eden.endpoint('model.deafen', this.onUnsubscribe, true);

    // Add listeners for events
    this.eden.on('model.save', this.onSave, true);
  }

  /**
   * On model save
   * @param  {Object}  opts
   */
  async onSave(opts) {
    // check updates
    opts.updates = opts.updates.filter((key) => {
      // check key
      return !['created_at', 'updated_at'].includes(key);
    });

    // don't emit if not required
    if (!opts.updates.length) return;

    // Get model
    const ModelClass = model(opts.model);

    // Load by id
    const gotModel = await ModelClass.findById(opts.id);

    // check should emit update
    if (gotModel.hasUpdated && !await gotModel.hasUpdated(opts.updates)) return;

    // Check models has
    if (!this.models.has(opts.model)) return;

    // Get cache
    const listeners = await this.eden.get(`model.listen.${opts.model.toLowerCase()}.${opts.id}`) || [];

    // Check length
    if (!listeners.length) return;

    // Log to eden
    this.logger.log('debug', `[update] ${opts.model.toLowerCase()} #${opts.id}`, {
      class : this.constructor.name,
    });

    // Emit sanitised
    const sent = [];

    // Loop listeners
    listeners.forEach(async (listener) => {
      // check atomic
      if (sent.includes(listener.session)) return;

      // atomic
      const atomic = {};

      // sanitised
      const sanitised = await gotModel.sanitise();

      // check atomically
      if (listener.atomic) {
        // emit only updates
        Object.keys(sanitised).forEach((key) => {
          // remove key if not in updated
          if (opts.updates.includes(key)) atomic[key] = sanitised[key];
        });
      }

      // hook
      await this.eden.hook(`model.${opts.model.toLowerCase()}.sync.sanitise`, { opts, sanitised, atomic, listener, model : gotModel });

      // send atomic update
      socket.session(listener.session, `model.update.${opts.model.toLowerCase()}.${opts.id}`, listener.atomic ? atomic : sanitised);

      // Push to sent
      sent.push(listener.session);
    });
  }

  /**
   * Listen to endpoint for live data
   *
   * @param  {String}  sessionID
   * @param  {String}  type
   * @param  {String}  id
   * @param  {String}  listenID
   */
  async onUnsubscribe(opts, type, id, listenID) {
    // Set model
    if (!this.models.has(type)) this.models.set(type, true);

    // Log to eden
    this.logger.log('debug', `[removeListener] ${type} #${id} for ${sessionID}`, {
      class : this.constructor.name,
    });

    // Lock listen
    const unlock = await this.eden.lock(`model.listen.${type}.${id}`);

    // Set cache
    let listeners = await this.eden.get(`model.listen.${type}.${id}`) || [];

    // Add sessionID to listeners
    listeners = listeners.filter((listener) => {
      // Return filtered
      return listener.uuid !== listenID;
    });

    // Set to eden again
    await this.eden.set(`model.listen.${type}.${id}`, listeners, 60 * 60 * 1000);

    // Unlock live listen set
    unlock();
  }

  /**
   * Listen to endpoint for live data
   *
   * @param  {String}  sessionID
   * @param  {String}  type
   * @param  {String}  id
   * @param  {String}  listenID
   * @param  {Boolean} atomic
   */
  async onSubscribe(opts, type, id, listenID, atomic = false) {
    // Set model
    if (!this.models.has(type)) this.models.set(type, true);

    // check atomic
    if (typeof atomic !== 'boolean') {
      // set vlaue
      opts = atomic;
      atomic = false;
    }

    // Log to eden
    this.logger.log('debug', `[listen] ${type} #${id} for ${sessionID}`, {
      class : this.constructor.name,
    });

    // Lock listen
    const unlock = await this.eden.lock(`model.listen.${type}.${id}`);

    // Set cache
    const listeners = await this.eden.get(`model.listen.${type}.${id}`) || [];

    // Check found
    const found = listeners.find((listener) => {
      // Return filtered
      return listener.session === opts.sessionID && listener.uuid === listenID;
    });

    // Add sessionID to listeners
    if (found) {
      // Update date
      found.last = new Date();
    } else {
      // Push listener
      listeners.push({
        ...opts,
  
        atomic,
        uuid : listenID,
        last : new Date(),
      });
    }

    // Set to eden again
    await this.eden.set(`model.listen.${type}.${id}`, listeners, 60 * 60 * 1000);

    // Unlock live listen set
    unlock();
  }
}

/**
 * Build live daemon class
 *
 * @type {ModelDaemon}
 */
module.exports = ModelDaemon;
