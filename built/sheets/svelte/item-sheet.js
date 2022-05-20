import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import { TJSDocument } from "@typhonjs-fvtt/runtime/svelte/store";
import { element } from "svelte/internal";

import DocumentShell from "./DocumentShell.svelte";

export class SvelteDocumentSheet extends SvelteApplication {
  /**
   * Document store that monitors updates to any assigned document.
   *
   * @type {TJSDocument<foundry.abstract.Document>}
   */
  #storeDoc = new TJSDocument(void 0, { delete: this.close.bind(this) });

  /**
   * Holds the document unsubscription function.
   *
   * @type {Function}
   */
  #storeUnsubscribe;

  constructor(object, options) {
    super(object, options);

    /**
     * @member {object} document - Adds accessors to SvelteReactive to get / set the document associated with
     *                             Document.
     *
     * @memberof SvelteReactive#
     */
    Object.defineProperty(this.reactive, "document", {
      get: () => this.#storeDoc.get(),
      set: (document) => {
        this.#storeDoc.set(document);
      },
    });
    this.reactive.document = object;
    // By doing the above you can now easily set a new document by `this.reactive.document = <A DOCUMENT>`
  }

  /**
   * Default Application options
   *
   * @returns {object} options - Application options.
   * @see https://foundryvtt.com/api/Application.html#options
   */
  static get defaultOptions() {
    let sheetThis = this;
    console.log(sheetThis)
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: "No Document Assigned",
      width: 450,
      height: "auto",
      resizable: true,
      minimizable: true,

      svelte: {
        class: DocumentShell,
        target: document.body,

        // You can assign a function that is invoked with MyItemApp instance as `this`.
        props: function () {
          return { storeDoc: this.#storeDoc };
        },
      },
    });
  }

  async close(options = {}) {
    console.log("close ", options);
    await super.close(options);

    if (this.#storeUnsubscribe) {
      this.#storeUnsubscribe();
      this.#storeUnsubscribe = void 0;
    }
  }

  /**
   * Handles any changes to document.
   *
   * @param {foundry.abstract.Document}  doc -
   *
   * @param {object}                     options -
   */
  async #handleDocUpdate(doc, options) {
    const { action, data, documentType } = options;
    const origDoc = game[`${doc.type}s`].get(doc.id); //reference to original DOcument
    const updateData = { img: doc.img, system: doc.system, flags: doc.flags, name: doc.name }; //updateData
    await origDoc?.update(updateData);

    // I need to add a 'subscribe' action to TJSDocument so must check void.
    if ((action === void 0 || action === "update") && doc) {
      this.reactive.title = doc?.name ?? "No Document Assigned";
    }
  }

  render(force = false, options = {}) {
    console.log(this, force, options, "render: this, force, options");
    if (!this.#storeUnsubscribe) {
      this.#storeUnsubscribe = this.#storeDoc.subscribe(this.#handleDocUpdate.bind(this));
    }
    super.render(force, options);
    return this;
  }
}
