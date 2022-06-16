<svelte:options accessors={true} />

<script>
  export let item = null;
  export let action;
  export let doc = null;
  export let type = null;
  function OpenItem() {
    item.sheet.render(true);
  }
  function DeleteItem() {
    item.delete();
  }
  async function CreateItem() {
    if (!doc) return;
    await Item.create([{ name: `New ${type}`, type: type }], { parent: doc });
  }
</script>

{#if action === "edit"}
  <i on:click={OpenItem()} class="fa-solid fa-pen-to-square" />
{/if}
{#if action === "delete"}
  <i on:click={DeleteItem()} class="fa-solid fa-trash-can" />
{/if}
{#if action === "create"}
  <i on:click={CreateItem()} class="fa-solid fa-file-plus" />
{/if}

<style lang="scss">
  i:hover {
    cursor: pointer;
    text-shadow: 0px 0px 10px red;
  }
</style>
