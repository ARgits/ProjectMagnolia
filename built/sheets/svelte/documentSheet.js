import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import { TJSDocument } from "@typhonjs-fvtt/runtime/svelte/store";
import { SessionStorage } from "@typhonjs-fvtt/runtime/svelte/store";
import DocumentShell from "./DocumentShell.svelte";
const storage = new SessionStorage();
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

  constructor(object) {
    super(object);

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
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: "No Document Assigned",
      width: 800,
      height: 600,
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
  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();
    let sheetConfig = storage.getItem("sheetConfig");
    buttons.unshift({
      class: "configure-sheet",
      icon: "fas fa-cog",
      title: "open sheet configurator",
      onclick: (ev) => this._onCofigureSheet(ev),
    });
    const canConfigure = game.user.isGM || (this.reactive.document.isOwner && game.user.can("TOKEN_CONFIGURE"));
    if (canConfigure && this.reactive.document.documentName === "Actor") {
      buttons.splice(1, 0, {
        label: this.token ? "Token" : "TOKEN.TitlePrototype",
        class: "configure-token",
        icon: "fas fa-user-circle",
        onclick: (ev) => this._onConfigureToken(ev),
      });
    }
    console.log(buttons);
    return buttons;
  }
  _onCofigureSheet(event) {
    if (event) event.preventDefault();
    new DocumentSheetConfig(this.reactive.document, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - SvelteDocumentSheet.defaultOptions.width) / 2,
    }).render(true);
  }
  _onConfigureToken(event) {
    if (event) event.preventDefault();
    const actor = this.reactive.document;
    const token = actor.isToken ? actor.token : actor.prototypeToken;
    new CONFIG.Token.prototypeSheetClass(token, {
      left: Math.max(this.position.left - 560 - 10, 10),
      top: this.position.top,
    }).render(true);
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
