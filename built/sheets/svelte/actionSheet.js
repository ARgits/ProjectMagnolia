import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import ActionShell from "./action/ActionShell.svelte";
import { writable, get } from "svelte/store";

export default class ActionSheet extends SvelteApplication {
    #action = writable(null);
    #damageInput = writable(null);
    /**
     * @type {Function}
     */
    #storeUnsubscribe;

    constructor(object) {
        super(object);
        Object.defineProperty(this.reactive, 'action', {
            get: () => get(this.#action),
            set: (document) => {
                this.#action.set(document);
            }
        });
        Object.defineProperty(this.reactive, 'damageInput', {
            get: () => get(this.#damageInput),
            set: (element) => {
                this.#damageInput.set(element);
            }
        });
        this.reactive.action = object;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: "Action Config",
            minimizable: true,
            resizable: true,
            width: 400,
            height: 600,
            svelte: {
                class: ActionShell,
                target: document.body,
                props: function () {
                    return { action: this.#action };
                }
            },
        });
    }

    async submit() {
        let item;
        const action = this.reactive.action;
        const actorId = action.parent.actor;
        const itemId = action.parent.item;
        if (actorId || itemId) {
            const uuid = itemId || actorId;
            item = await fromUuid(uuid);
        }
        else {
            return;
        }
        let actionList = [...item.system.actionList];
        const index = [...item.system.actionList].findIndex(a => a.id === action.id);
        if (index !== -1) {
            actionList.splice(index, 1);
            actionList = [...actionList, action];
            await item.update({ "system.actionList": actionList });
        }
    }

    render(force = false, options = {}) {
        if (!this.#storeUnsubscribe) {
            this.#storeUnsubscribe = this.#action.subscribe(this.#handleDocUpdate.bind(this));
        }
        super.render(force, options);
        return this;
    }

    async #handleDocUpdate(doc, options) {
    }
}
