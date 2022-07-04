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
    let itemNumber = doc.itemTypes[type].filter((item)=>{return item.name.slice(0,type.length+6)===`New ${type} #`}).length

    await Item.create([{ name: `New ${type} #${itemNumber+1}`, type: type }], { parent: doc });
  }
</script>

{#if action === "edit"}
  <i on:click={() => OpenItem()} class="fa-solid fa-pen-to-square" data-tooltip="edit" />
{/if}
{#if action === "delete"}
  <i on:click={() => DeleteItem()} class="fa-solid fa-trash-can" data-tooltip="delete"/>
{/if}
{#if action === "create"}
  <i on:click={() => CreateItem()} class="fa-solid fa-file-plus" data-tooltip="create new {type}" />
{/if}

<style lang="scss">
  i:hover {
    cursor: pointer;
    text-shadow: 0px 0px 10px red;
  }
</style>
