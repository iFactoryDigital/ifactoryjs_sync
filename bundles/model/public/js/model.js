// Require dependencies
const uuid    = require('uuid');
const Events  = require('events');
const dotProp = require('dot-prop');

/**
 * Create live model class
 *
 * @extends events
 */
class EdenModel extends Events {
  /**
   * Construct model class
   *
   * @param {String} type
   * @param {String} id
   * @param {Object} object
   */
  constructor(type, id, opts) {
    // Run super
    super();

    // set max listeners
    this.setMaxListeners(0);

    // Set id
    this.__id = id;
    this.__data = opts;
    this.__type = type;
    this.__viewListeners = new Set();

    // Bind methods
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.build = this.build.bind(this);
    this.listen = this.listen.bind(this);
    this.setOpts = this.setOpts.bind(this);
    this.refresh = this.refresh.bind(this);
    this.destroy = this.destroy.bind(this);

    // Bind private methods
    this._update = this._update.bind(this);
    this._connect = this._connect.bind(this);

    // set view
    this.view = {
      add    : this.viewAdd.bind(this),
      remove : this.viewRemove.bind(this),
    };

    // Build
    if (typeof eden !== 'undefined') this.building = this.build();
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // BUILD METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Builds this
   */
  async build() {
    // Listen
    await this.listen();
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // GET/SET METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Returns data key
   *
   * @param  {String} key
   *
   * @return {*}
   */
  get(key) {
    // Check key
    if (!key || !key.length) return this.__data;

    // Return this key
    return dotProp.get(this.__data, key);
  }

  /**
   * Returns data key
   *
   * @param  {String} key
   *
   * @return {*}
   */
  set(key, value) {
    // Return this key
    dotProp.set(this.__data, key, value);

    // emit key
    this.emit(key);

    // emit base key
    if (key !== key.split('.')[0]) this.emit(key.split('.')[0]);

    // return get key
    return this.get(key);
  }

  /**
   * sets opts
   *
   * @param {Object} opts
   */
  setOpts(opts) {
    // update
    return this._update(opts);
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // VIEW METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * view add
   *
   * @param  {String} uuid
   */
  viewAdd(id) {
    // add uuid
    if (id) this.__viewListeners.add(id);
  }

  /**
   * view add
   *
   * @param  {String} uuid
   */
  viewRemove(id) {
    // add uuid
    this.__viewListeners.delete(id);

    // clear timeout
    if (this.__viewTimeout) clearTimeout(this.__viewTimeout);

    // set timeout
    this.__viewTimeout = setTimeout(() => {
      // check listeners
      if (this.__viewListeners.size) return;

      // deafen
      this.destroy();
    }, 5 * 1000);
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // LISTEN METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Refreshes this
   */
  async refresh() {
    // Await building
    await this.building;

    // Call eden
    const object = await eden.socket.call(`model.refresh.${this.__type}`, this.__id);

    // Run update
    this._update(object);
  }

  /**
   * Listens to model by id
   *
   * @return {Promise}
   */
  async destroy() {
    // Await building
    await this.building;

    // destroy
    this.emit('destroy');

    // check window
    if (typeof window === 'undefined') return;

    // Create new promise
    const promise = new Promise(async (resolve) => {
      // Call eden
      await eden.socket.call(`model.deafen.${this.__type}`, this.__id, this.__uuid);

      // Set listen
      this.__isListening = false;

      // Add on event
      eden.socket.off(`model.update.${this.__type}.${this.__id}`, this._update);

      // Listen to connect again
      eden.socket.off('connect', this._connect);
      eden.socket.off('connected', this._connect);

      // Resolve
      resolve();
    });

    // Return await deafening
    return await promise;
  }

  /**
   * Listens to model by id
   *
   * @return {Promise}
   */
  async listen() {
    // Await building
    await this.building;

    // check id
    if (!this.__id) return null;

    // Set uuid
    if (!this.__uuid) this.__uuid = uuid();

    // check window
    if (typeof window === 'undefined') return;

    // Create new promise
    const promise = new Promise(async (resolve) => {
      // Call eden
      eden.socket.call(`model.listen.${this.__type}`, this.__id, this.__uuid);

      // Set listen
      this.__isListening = true;

      // Add on event
      eden.socket.on(`model.update.${this.__type}.${this.__id}`, this._update);

      // Listen to connect again
      eden.socket.on('connect', this._connect);
      eden.socket.on('connected', this._connect);

      // Resolve
      resolve();
    });

    // Return listening promise
    return await promise;
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // PRIVATE METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * On update
   *
   * @param  {Object} object
   */
  _update(object) {
    // set is updated
    let isUpdated = false;

    // Update details
    for (const key of Object.keys(object)) {
      // Check differences
      if (((!this.__data[key] && object[key]) || typeof this.__data[key] === typeof object[key]) && JSON.stringify(this.__data[key]) !== JSON.stringify(object[key])) {
        // Listen to object key
        this.__data[key] = object[key];

        // Emit event
        this.emit(key, object[key]);

        // is updated
        isUpdated = true;
      }
    }

    // Emit update
    if (isUpdated) this.emit('update');
  }

  /**
   * On socket reconnect
   */
  _connect() {
    // Reconnected
    if (this.__isListening) {
      // Call live listen again
      eden.socket.call(`model.listen.${this.__type}`, this.__id, this.__uuid);
    }
  }
}

/**
 * Export live model class
 *
 * @type {EdenModel}
 */
module.exports = EdenModel;
