import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
import DamageTypeShell from "./DamageTypeShell.svelte";

export default class DamageTypeDialog extends TJSDialog {
    constructor(data) {
        super(
            {
                title: "Damage Type",
                modal: true,
                draggable: true,
                content: {
                    class: DamageTypeShell,
                    props: {
                        data,
                    },
                },
            },
            {
                width: 400,
                height: 200,
            }
        );
    }
}