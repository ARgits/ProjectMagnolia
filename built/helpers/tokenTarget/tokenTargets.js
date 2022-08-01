import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import TargetsShell from "./TargetsShell.svelte";
import { TJSDocument } from "@typhonjs-fvtt/runtime/svelte/store";
import { derived, get } from "svelte/store";

export default class TokenTargets extends SvelteApplication
{
    #storeDoc = new TJSDocument(void 0);
    #storeUnsubscribe;

    constructor(object = {}, options = {})
    {
        super(object);
        Object.defineProperty(this.reactive, "document", {
            get: () => this.#storeDoc.get(),
            set: (document) =>
            {
                this.#storeDoc.set(document);
            }
        });
        this.reactive.document = object;
    }

    static get defaultOptions()
    {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ard20"],
            title: "Targets",
            minimizable: true,
            resizable: true,
            width: 600,
            height: "auto",
            svelte: {
                class: TargetsShell,
                target: document.body,
                props: function ()
                {
                    return {
                        mainToken: this.#storeDoc,
                    };
                }
            },
        });
    }

    async #handleDocUpdates(doc, options)
    {
        const { action, data, documentType } = options;
        if ((action === "update" || action === "subscribe") && doc)
        {
            this.reactive.x = doc.x;
            this.reactive.y = doc.y;
        }
    }

    getTargets(doc)
    {
        console.log('looking for tokens', doc);
        const token = doc.object;
        const uuid = doc.uuid;
        const vision = token.vision;
        return game.scenes.current.tokens.filter((t) =>
        {
            return t.uuid !== uuid && vision.fov.contains(t.x, t.y);
        });
    }
    render(force = false, options = {})
    {
        if (!this.#storeUnsubscribe)
        {
            this.#storeUnsubscribe = this.#storeDoc.subscribe(this.#handleDocUpdates.bind(this));
        }
        super.render(force, options);
        return this;
    }

}