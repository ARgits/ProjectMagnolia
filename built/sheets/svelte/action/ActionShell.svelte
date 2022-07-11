<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  export let action;
  console.log(action);
  const { application } = getContext("external");
  async function submit() {
    let item;
    const actorId = action.parent.actor._id;
    const itemId = action.parent.item._id;
    if (actorId) {
      item = game.actors.get(actorId).items.get(itemId);
    } else if (itemId) {
      item = game.items.get(itemId);
    } else {
      console.log("ОШиБКА БЛЯТЬ");
      return;
    }
    const actionList = [...item.system.actionList];
    await item.update({ "system.actionList": actionList });
    application.close();
  }
</script>

<div class="main">
  <h2>This is main tab</h2>
  <div class="name">
    Name: <input bind:value={action.name} />
  </div>
  <div>
    Formula: <input bind:value={action.formula} />
  </div>
  <button
    on:click={() => {
      submit();
    }}
  >
    Submit
  </button>
</div>

<style lang="scss">
</style>
