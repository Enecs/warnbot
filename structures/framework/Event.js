module.exports = class Event {
  /**
   * Available properties for the event
   * @param {Object} client - Bot client object
   * @param {String} options.name - Name of the event
   * @param {String} options.description - Is the event a raw websocket event
   * @param {Boolean} options.enabled - Is the event enabled
   */
  constructor(client, options) {
    this.client = client;
    this.enabled = "enabled" in options ? options.enabled : true;
    
    this.conf = { 
      name: null,
      ws: options.ws || false
    };
  }

  run() {
    throw new Error('Event run method not implemented');
  }
}
