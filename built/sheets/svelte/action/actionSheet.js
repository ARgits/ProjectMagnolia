import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import ActionShell from "./ActionShell.svelte";

export default class ActionSheet extends SvelteApplication {
    #action;

    constructor(object, options) {
        super(object);
        console.log(object, options);
        this.#action = object;
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
