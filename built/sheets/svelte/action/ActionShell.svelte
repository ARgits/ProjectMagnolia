<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  export let action;
  const { application } = getContext("external");
  async function submit() {
    const item = action.parent.item;
    const actionList = [...item.system.actionList];
    await parent.update({ "system.actionList": actionList });
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
