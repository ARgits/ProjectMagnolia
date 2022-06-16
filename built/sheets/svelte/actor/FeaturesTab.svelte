<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  const doc = getContext("DocumentSheetObject");
  let highlight = "";
  console.log($doc.items, "actors items tab");
  function DeleteItem(item) {
    item.delete();
  }
  function OpenItem(item) {
    item.sheet.render(true);
  }
</script>

<table>
  <thead>
    <th>Name</th>
    <th>Level</th>
    <th colspan="3">Config.</th>
  </thead>
  <tbody>
    {#each $doc.items.contents as item}
      <tr>
        <td>{item.name}</td>
        <td>{item.system.level.current}</td>
        <td class="config"><i on:click={() => OpenItem(item)} class="fa-solid fa-pen-to-square" on /></td>
        <td class="config"><i class="fa-solid fa-stars" /></td>
        <td class="config"><i on:click={() => DeleteItem(item)} class="fa-solid fa-trash-can" /></td>
      </tr>
    {/each}
  </tbody>
</table>

<style lang="scss">
  td {
    text-align: center;
    &.config {
      width: 5%;
    }
  }
</style>
