import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import CharacterAdvancementShell from "../../helpers/Character Advancement/cha-adv-shell.svelte";
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
    if (this.reactive.document.documentName === "Actor") {
      if (canConfigure) {
        buttons.splice(1, 0, {
          label: this.token ? "Token" : "TOKEN.TitlePrototype",
          class: "configure-token",
          icon: "fas fa-user-circle",
          onclick: (ev) => this._onConfigureToken(ev),
        });
      }
      buttons.unshift({
        class: "character-progress",
        title: "Character Advancement",
        label: "Character Advancement",
        icon:"fa-solid fa-book-sparkles",
        onclick: (ev) => this._onCharacterAdvancement(ev),
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
  _onCharacterAdvancement(event){
    if(event)event.preventDefault();
    const actor = this.reactive.document
    async function createAditionalData() {
      //functions to get lists of available features and lists
      async function getPacks() {
        let pack_list = []; // array of feats from Compendium
        let pack_name = [];
        for (const val of game.settings.get("ard20", "feat").packs) {
          if (game.packs.filter((pack) => pack.metadata.label === val.name).length !== 0) {
            let feat_list = [];
            feat_list.push(
              Array.from(
                game.packs.filter((pack) => pack.metadata.label === val.name && pack.documentName === "Item")[0]
                  .index
              )
            );
            feat_list = feat_list.flat();
            for (const feat of feat_list) {
              const new_key =
                game.packs.filter((pack) => pack.metadata.label === val.name)[0].metadata.package + "." + val.name;
              const doc = await game.packs.get(new_key).getDocument(feat.id);
              const item = doc.toObject();
              item.data = foundry.utils.deepClone(doc.system);
              pack_list.push(item);
              pack_name.push(item.name);
            }
            pack_list = pack_list.flat();
          }
        }
        return {
          pack_list,
          pack_name,
        };
      }
      function getFolders() {
        let folder_list = []; // array of feats from game folders
        let folder_name = [];
        for (let val of game.settings.get("ard20", "feat").folders) {
          if (game.folders.filter((folder) => folder.data.name === val.name).length !== 0) {
            let feat_list = [];
            feat_list.push(
              game.folders.filter((folder) => folder.data.name === val.name && folder.data.type === "Item")[0]
                .contents
            );
            feat_list = feat_list.flat();
            for (let feat of feat_list) {
              console.log("item added from folder ", feat);
              const item = feat.toObject();
              item.data = foundry.utils.deepClone(feat.system);
              folder_list.push(item);
              folder_name.push(item.name);
            }
            folder_list = folder_list.flat();
          }
        }
        return {
          folder_list,
          folder_name,
        };
      }
      let raceList = await getRacesList();
      let featList = await getFeaturesList();
      let name_array = [];

      async function getRacesList() {
        const pack = await getPacks();
        const folder = getFolders();
        const pack_list = pack.pack_list;
        const pack_name = pack.pack_name;
        const folder_list = folder.folder_list;
        let race_pack_list = [];
        let race_folder_list = [];
        pack_list.forEach((item) => {
          if (item.type === "race") {
            let raceItem = { ...item, chosen: false };
            race_pack_list.push(raceItem);
          }
        });
        folder_list.forEach((item) => {
          if (item.type === "race") {
            let raceItem = { ...item, chosen: false };
            race_folder_list.push(raceItem);
          }
        });
        return race_pack_list.concat(race_folder_list.filter((item) => !pack_name.includes(item.name)));
      }
      async function getFeaturesList() {
        const pack = await getPacks();
        const pack_list = pack.pack_list;
        const pack_name = pack.pack_name;
        const folder = getFolders();
        const folder_list = folder.folder_list;
        let feat_pack_list = [];
        pack_list.forEach((item) => {
          if (item.type === "feature") {
            let FeatureItem = { ...item };
            feat_pack_list.push(FeatureItem);
          }
        });
        let feat_folder_list = [];
        folder_list.forEach((item) => {
          if (item.type === "feature") {
            let FeatureItem = { ...item };
            feat_folder_list.push(FeatureItem);
          }
        });
        let temp_feat_list = feat_pack_list.concat(
          feat_folder_list.filter((item) => !pack_name.includes(item.name))
        );
        let learnedFeatures = [];
        actor.itemTypes.feature.forEach((item) => {
          if (item.data.type === "feature") {
            let FeatureItem = { ...item.data };
            learnedFeatures.push(FeatureItem);
          }
        });
        return { temp_feat_list, learnedFeatures };
      }
      for (let i of featList.learnedFeatures) {
        name_array.push(i.name);
      }
      console.log(featList.temp_feat_list, "featList.temp_feat_list")
      featList.temp_feat_list.forEach((v, k) => {
        console.log(k, v);
        if (name_array.includes(v.name)) {
          console.log("this item is already learned", featList.temp_feat_list[k]);
          featList.temp_feat_list[k] = foundry.utils.deepClone(
            featList.learnedFeatures.filter((item) => item.name === v.name)[0]
          );
        }
      });
      featList.temp_feat_list = featList.temp_feat_list.filter((item) => {
        if (item.type === "feature")
          return !name_array.includes(item.name) || item.data.level.current !== item.data.level.max;
      });
      const obj = {
        races: { list: raceList, chosen: "" },
        count: {
          //TODO: rework this for future where you can have more/less ranks
          skills: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
          feats: { mar: 0, mag: 0, div: 0, pri: 0, psy: 0 },
        },
        feats: {
          learned: featList.learnedFeatures,
          awail: featList.temp_feat_list,
        },
        allow: {
          attribute: duplicate(actor.system.isReady),
          race: duplicate(actor.system.isReady),
          final: duplicate(actor.system.isReady),
        },
      };
      return obj;
    }
    const document = {
      id: actor.id,
      aditionalData: await createAditionalData(),
    };
    app = new CharacterAdvancement(document);
    app?.render(true);

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
class CharacterAdvancement extends TJSDialog {
  constructor(document) {
    super(
      {
        title: "Character advancement",
        id: "cha-adv",
        modal: true,
        draggable: false,
        content: {
          class: CharacterAdvancementShell,
          props: {
            document,
          },
        },
      },
      {
        width: 800,
        height: 600,
      }
    );
  }
}
