import { Injectable, EventEmitter } from '@angular/core';
/**
 * @name Events
 * @description
 * Events is a publish-subscribe style event system for sending and responding to application-level
 * events across your app.
 *
 * @usage
 * ```ts
 * import { Events } from 'ionic-angular';
 *
 * // first page (publish an event when a user is created)
 * constructor(public events: Events) { }
 *
 * createUser(user) {
 *   console.log('User created!')
 *   this.events.publish('user:created', user, Date.now());
 * }
 *
 *
 * // second page (listen for the user created event after function is called)
 * constructor(public events: Events) {
 *   events.subscribe('user:created', (user, time) => {
 *     // user and time are the same arguments passed in `events.publish(user, time)`
 *     console.log('Welcome', user, 'at', time);
 *   });
 * }
 *
 * ```
 * @demo /docs/demos/src/events/
 */
@Injectable({
    providedIn: 'root'
  })
export class EventManagerService {
  public _channels: any = [];

  /**
   * Subscribe to an event topic. Events that get posted to that topic will trigger the provided handler.
   *
   * @param {string} topic the topic to subscribe to
   * @param {function} handler the event handler
   */
  subscribe(topic: string, ...handlers: Function[]) {
    if (!this._channels[topic]) {
      this._channels[topic] = [];
    }
    handlers.forEach((handler) => {
      this._channels[topic].push(handler);
    });
  }

  /**
   * Unsubscribe from the given topic. Your handler will no longer receive events published to this topic.
   *
   * @param {string} topic the topic to unsubscribe from
   * @param {function} handler the event handler
   *
   * @return true if a handler was removed
   */
  unsubscribe(topic: string, handler: Function = null) {
    let t = this._channels[topic];
    if (!t) {
      // Wasn't found, wasn't removed
      return false;
    }

    if (!handler) {
      // Remove all handlers for this topic
      delete this._channels[topic];
      return true;
    }

    // We need to find and remove a specific handler
    let i = t.indexOf(handler);

    if (i < 0) {
      // Wasn't found, wasn't removed
      return false;
    }

    t.splice(i, 1);

    // If the channel is empty now, remove it from the channel map
    if (!t.length) {
      delete this._channels[topic];
    }

    return true;
  }

  /**
   * Publish an event to the given topic.
   *
   * @param {string} topic the topic to publish to
   * @param {any} eventData the data to send as the event
   */
  publish(topic: string, ...args: any[]) {
    var t = this._channels[topic];
    if (!t) {
      return null;
    }

    let responses: any[] = [];
    t.forEach((handler: any) => {
      responses.push(handler(...args));
    });
    return responses;
  }
}