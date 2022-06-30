import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
import {ActionShell} from "../action/ActionShell.svelte"
export class ActionSheet extends TJSDialog {
  constructor(document) {
    super(
      {
        title: "Character advancement",
        id: "cha-adv",
        modal: true,
        draggable: false,
        content: {
          class: ActionShell,
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
