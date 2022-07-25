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
  async function addToFavorite(){
    if(!doc) return;
    let favorites = doc.system.favorites
    favorites.push(item)
    doc.update({'system.favorites':favorites})
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
{#if action === 'favorite'}
    <i on:click={()=> addToFavorite()} class="fa-solid fa-stars" data-tooltip='add to favorite'/>
{/if}

<style lang="scss">
  i:hover {
    cursor: pointer;
    text-shadow: 0px 0px 10px blue;
  }
</style>
