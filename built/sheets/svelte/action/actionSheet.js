import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import ActionShell from "./ActionShell.svelte";
import { writable } from "svelte/store";

export default class ActionSheet extends SvelteApplication {
    #action = writable(null);

    constructor(object, options) {
        super(object);
        console.log(object, options);
        Object.defineProperty(this.reactive, 'action', {
            get: () => get(this.#action),
            set: (document) => {
                this.#action.set(document);
            }
        });
        console.log(object, this.#action);
        this.reactive.action = object;
        console.log(this.#action);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: "Action Config",
            minimizable: true,
            resizable: true,
            width: 400,
            height: 600,
            id: "",
            svelte: {
                class: ActionShell,
                target: document.body,
                props: function () {
                    return { action: this.#action };
                }
            },
        });

    }

    render(force = false, options = {}) {
        console.log(this);
        console.trace();
        super.render(force, options);
        return this;
    }
}
