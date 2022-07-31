import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import TargetsShell from "./TargetsShell.svelte";

export default class TokenTargets extends SvelteApplication
{
    constructor(object={},options={})
    {
        super();
        console.log(object, options)
    }
    static get defaultOptions()
    {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ard20"],
            title: "Advancement Rate",
            minimizable: true,
            resizable: true,
            width: 600,
            height: 600,
            svelte: {
                class: TargetsShell,
                target: document.body,
            },
        });
    }

}