<svelte:options accessors={true} />

<script>
  export let item;
  export let type;
  function OpenItem() {
    item.sheet.render(true);
  }
  function DeleteItem() {
    item.delete();
  }
</script>

{#if type === "edit"}
  <i on:click={() => OpenItem()} class="fa-solid fa-pen-to-square" />
{/if}
{#if type === "delete"}
  <i on:click={() => DeleteItem()} class="fa-solid fa-trash-can" />
{/if}

<style lang="scss">
  i:hover {
    cursor: pointer;
    box-shadow: 2px 2px 2px red;
  }
</style>
