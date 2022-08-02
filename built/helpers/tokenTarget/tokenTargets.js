import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import TargetsShell from "./TargetsShell.svelte";
import { TJSDocument } from "@typhonjs-fvtt/runtime/svelte/store";
import { writable } from "svelte/store";

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

    configureTargets(doc) {
        let targets = [];
        const token = doc.object;
        const uuid = doc.uuid;
        const fov = token.vision.fov;
        const allTokens = game.scenes.current.tokens.filter(t => {return t.uuid !== uuid;});
        for (const target of allTokens) {
            const canSee = fov.contains(target.x, target.y);
            if (canSee) {
                targets.push(target);
            }
            else {
                target.object.setTarget(false, { releaseOthers: false })
            }
        }
        return writable(targets)
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