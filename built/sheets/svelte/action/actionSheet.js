import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
import ActionShell from "./ActionShell.svelte";
export default class ActionSheet extends TJSDialog {
  constructor(action) {
    super(
      {
        title: "Action Config",
        id: "act-config",
        modal: false,
        draggable: true,
        content: {
          class: ActionShell,
          props: {
            action,
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
