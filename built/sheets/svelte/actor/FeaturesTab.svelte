<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  import ConfigureItemButton from "../general components/ConfigureItemButton.svelte";
  const doc = getContext("DocumentSheetObject");
  let highlight = "";
  console.log($doc.items, "actors items tab");
</script>

<table>
  <thead>
    <th>Name</th>
    <th>Level</th>
    <th colspan="3">Config.</th>
  </thead>
  <tbody>
    {#each $doc.itemTypes.feature as item}
      <tr>
        <td>{item.name}</td>
        <td>{item.system.level.current}</td>
        <td class="config"><ConfigureItemButton {item} type="edit" /></td>
        <td class="config"><i class="fa-solid fa-stars" /></td>
        <td class="config"><ConfigureItemButton {item} type="delete" /></td>
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
