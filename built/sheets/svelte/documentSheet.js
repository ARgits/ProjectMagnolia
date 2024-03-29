import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import { TJSDocument } from "@typhonjs-fvtt/runtime/svelte/store";
import DocumentShell from "./DocumentShell.svelte";
import { CharacterAdvancement } from "../../helpers/Character Advancement/characterAdvancement.js";

export class SvelteDocumentSheet extends SvelteApplication {
    /**
     * Document store that monitors updates to any assigned document.
     *
     * @type {TJSDocument<foundry.abstract.Document>}
     *
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
            dragDrop: [{ dragSelector: ".directory-list .item", dropSelector: null }],
            svelte: {
                class: DocumentShell,
                target: document.body,
                props: function () {
                    return { storeDoc: this.#storeDoc };
                },
            },
        });
    }

    _getHeaderButtons() {
        const buttons = super._getHeaderButtons();
        buttons.unshift({
            class: "configure-sheet",
            icon: "fas fa-cog",
            title: "Open sheet configurator",
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
                icon: "fa-solid fa-book-sparkles",
                onclick: async (ev) => await this._onCharacterAdvancement(ev),
            });
        }
        return buttons;
    }

    /**
     * Drag&Drop handling
     *
     *
     */

    _canDragStart(selector) {
        return true;
    }

    _canDragDrop(selector) {
        return this.reactive.document.isOwner || game.user.isGM;
    }

    _onDragOver(event) {
    }

    _onDragStart(event) {
        {
            const li = event.currentTarget;
            if (event.target.classList.contains("content-link")) {
                return;
            }

            // Create drag data
            let dragData;

            // Owned Items
            if (li.dataset.itemId) {
                const item = this.actor.items.get(li.dataset.itemId);
                dragData = item.toDragData();
            }

            // Active Effect
            if (li.dataset.effectId) {
                const effect = this.actor.effects.get(li.dataset.effectId);
                dragData = effect.toDragData();
            }

            if (!dragData) {
                return;
            }

            // Set data transfer
            event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        }
    }

    async _onDrop(event) {
        if (this.reactive.document.documentName !== "Actor") {
            return;
        }
        const data = TextEditor.getDragEventData(event);
        const actor = this.reactive.document;

        /**
         * A hook event that fires when some useful data is dropped onto an ActorSheet.
         * @function dropActorSheetData
         * @memberof hookEvents
         * @param {Actor} actor      The Actor
         * @param {ActorSheet} sheet The ActorSheet application
         * @param {object} data      The data that has been dropped onto the sheet
         */
        const allowed = Hooks.call("dropActorSheetData", actor, this, data);
        if (allowed === false) {
            return;
        }

        // Handle different data types
        switch (data.type) {
            case "ActiveEffect":
                return this._onDropActiveEffect(event, data, actor);
            case "Actor":
                return this._onDropActor(event, data, actor);
            case "Item":
                return this._onDropItem(event, data, actor);
            case "Folder":
                return this._onDropFolder(event, data, actor);
        }
    }

    async _onDropActiveEffect(event, data, actor) {
        const effect = await ActiveEffect.implementation.fromDropData(data);
        if (!actor.isOwner || !effect) {
            return false;
        }
        if (actor.uuid === effect.parent.uuid) {
            return false;
        }
        return ActiveEffect.create(effect.toObject(), { parent: actor });
    }

    async _onDropActor(event, data, actor) {
        if (!actor.isOwner) {
            return false;
        }
    }

    async _onDropItem(event, data, actor) {
        if (!actor.isOwner) {
            return false;
        }
        const item = await Item.implementation.fromDropData(data);
        const itemData = item.toObject();

        // Handle item sorting within the same Actor
        if (actor.uuid === item.parent?.uuid) {
            return this._onSortItem(event, itemData, actor);
        }

        // Create the owned item
        return this._onDropItemCreate(itemData, actor);
    }

    async _onDropFolder(event, data, actor) {
        if (!actor.isOwner) {
            return [];
        }
        if (data.documentName !== "Item") {
            return [];
        }
        const folder = await Folder.implementation.fromDropData(data);
        if (!folder) {
            return [];
        }
        return this._onDropItemCreate(
            folder.contents.map((item) => {
                return game.items.fromCompendium(item);
            })
        );
    }

    async _onDropItemCreate(itemData, actor) {
        itemData = itemData instanceof Array ? itemData : [itemData];
        return actor.createEmbeddedDocuments("Item", itemData);
    }

    _onSortItem(event, itemData, actor) {
        // Get the drag source and drop target
        const items = actor.items;
        const source = items.get(itemData._id);
        const dropTarget = event.target.closest("[data-item-id]");
        const target = items.get(dropTarget.dataset.itemId);

        // Don't sort on yourself
        if (source.id === target.id) {
            return;
        }

        // Identify sibling items based on adjacent HTML elements
        const siblings = [];
        for (let el of dropTarget.parentElement.children) {
            const siblingId = el.dataset.itemId;
            if (siblingId && siblingId !== source.id) {
                siblings.push(items.get(el.dataset.itemId));
            }
        }

        // Perform the sort
        const sortUpdates = SortingHelpers.performIntegerSort(source, { target, siblings });
        const updateData = sortUpdates.map((u) => {
            const update = u.update;
            update._id = u.target.data._id;
            return update;
        });

        // Perform the update
        return actor.updateEmbeddedDocuments("Item", updateData);
    }

    /**
     *
     *
     *
     */
    _onCofigureSheet(event) {
        if (event) {
            event.preventDefault();
        }
        new DocumentSheetConfig(this.reactive.document, {
            top: this.position.top + 40,
            left: this.position.left + (this.position.width - SvelteDocumentSheet.defaultOptions.width) / 2,
        }).render(true);
    }

    _onConfigureToken(event) {
        if (event) {
            event.preventDefault();
        }
        const actor = this.reactive.document;
        const token = actor.isToken ? actor.token : actor.prototypeToken;
        new CONFIG.Token.prototypeSheetClass(token, {
            left: Math.max(this.position.left - 560 - 10, 10),
            top: this.position.top,
        }).render(true);
    }

    async _onCharacterAdvancement(event) {
        if (event) {
            event.preventDefault();
        }
        const actor = this.reactive.document;

        async function createAditionalData() {
            //functions to get lists of available features and lists
            async function getPacks() {
                let pack_list = []; // array of feats from Compendium
                let pack_name = [];
                for (const val of game.settings.get("ard20", "feat").packs) {
                    if (game.packs.filter((pack) => pack.metadata.label === val.name).length !== 0) {
                        let feat_list = [];
                        feat_list.push(Array.from(game.packs.filter((pack) => pack.metadata.label === val.name && pack.documentName === "Item")[0].index));
                        feat_list = feat_list.flat();
                        for (const feat of feat_list) {
                            const new_key = game.packs.filter((pack) => pack.metadata.label === val.name)[0].metadata.package + "." + val.name;
                            const doc = await game.packs.get(new_key).getDocument(feat.id);
                            const item = doc.toObject();
                            item.system = foundry.utils.deepClone(doc.system);
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
                        feat_list.push(game.folders.filter((folder) => folder.data.name === val.name && folder.data.type === "Item")[0].contents);
                        feat_list = feat_list.flat();
                        for (let feat of feat_list) {
                            const item = feat.toObject();
                            item.system = foundry.utils.deepClone(feat.system);
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
                let temp_feat_list = feat_pack_list.concat(feat_folder_list.filter((item) => !pack_name.includes(item.name)));
                let learnedFeatures = [];
                actor.itemTypes.feature.forEach((item) => {
                    if (item.type === "feature") {
                        let FeatureItem = { ...item };
                        learnedFeatures.push(FeatureItem);
                    }
                });
                return { temp_feat_list, learnedFeatures };
            }

            for (let i of featList.learnedFeatures) {
                name_array.push(i.name);
            }
            featList.temp_feat_list.forEach((v, k) => {
                if (name_array.includes(v.name)) {
                    featList.temp_feat_list[k] = foundry.utils.deepClone(featList.learnedFeatures.filter((item) => item.name === v.name)[0]);
                }
            });
            featList.temp_feat_list = featList.temp_feat_list.filter((item) => {
                if (item.type === "feature") {
                    return !name_array.includes(item.name) || item.system.level.current !== item.system.level.max;
                }
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
            actor: actor,
            aditionalData: await createAditionalData(),
        };
        new CharacterAdvancement(document).render(true, { focus: true });
    }

    async close(options = {}) {
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

        if ((action === void 0 || action === "update" || action === "subscribe") && doc) {
            this.reactive.title = doc?.isToken ? `[Token] ${doc?.name}` : doc?.name ?? "No Document Assigned";
        }
    }

    render(force = false, options = {}) {
        if (!this.#storeUnsubscribe) {
            this.#storeUnsubscribe = this.#storeDoc.subscribe(this.#handleDocUpdate.bind(this));
        }

        console.log(this.reactive.document);
        super.render(force, options);
        return this;
    }

    addToFavorite(item) {
        const doc = this.reactive.document;
        const uuid = item.uuid;
        if (doc.documentName !== "Actor") {
            return;
        }
        let favorites = doc.system.favorites;
        favorites.push(uuid);
        doc.update({ "system.favorites": favorites });
    }

    async createEmbeddedItem(type) {
        const doc = this.reactive.document;
        if (doc.documentName !== "Actor") {
            return;
        }
        const itemNumber = doc.itemTypes[type].filter((document) => {
            return document.name.slice(0, type.length + 6) === `New ${type} #`;
        }).length;
        await Item.create([{ name: `New ${type} #${itemNumber + 1}`, type: type }], { parent: doc });
    }

    deleteEmbeddedItem(item) {
        item.delete();
    }

    showEmbeddedItem(item) {
        item.sheet.render(true);
    }

    async updateDocument(path, value) {
        const document = this.reactive.document;
        const update = {};
        update[path] = value;
        await document.update(update);
    }
}
