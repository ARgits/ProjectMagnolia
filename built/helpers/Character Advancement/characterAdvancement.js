import CharacterAdvancementShell from "../../helpers/Character Advancement/cha-adv-shell.svelte";
import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
export class CharacterAdvancement extends TJSDialog {
  constructor(document) {
    super(
      {
        title: "Character advancement",
        id: "cha-adv",
        modal: true,
        draggable: false,
        content: {
          class: CharacterAdvancementShell,
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
