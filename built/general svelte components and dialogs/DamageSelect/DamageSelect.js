import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
import DamageSelectDialog from "./DamageSelectDialog.svelte";

export default class DamageSelect extends TJSDialog {
    constructor(document) {
        super(
            {
                title: `Damage Selection for ${document.documentName}: ${document.name}`,
                id: "cha-adv",
                modal: true,
                draggable: false,
                content: {
                    class: DamageSelectDialog,
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