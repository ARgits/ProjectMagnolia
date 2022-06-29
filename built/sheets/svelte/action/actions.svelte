<script>
  import { ActionClass } from "./Action_1.js";
  import Action from "./Action.svelte";
  let actions = [
    {
      name: "my action",
      type: "attack",
      bonus: 0,
      formula: "2d10",
      subActions: [{ name: "my subActon", type: "damage", formula: "1d6", bonus: 0, subActions: [{ name: "subSubAction",  subActions: [], type:"effect" }] }],
    },
  ];
  function addAction(actionData) {
    let valid = true;
    let name = actionData?.name ?? "New Action";
    let type = actionData?.type ?? "attack";
    let bonus = actionData?.bonus ?? 0;
    let formula = "2d10";
    let range = "2";
    let template = null;
  }
</script>

<div class="main">
  {#each actions as action}
    <Action {...action} />
  {/each}
</div>

<style>
  div.main {
    width: fit-content;
    border: 1px solid black;
  }
</style>
