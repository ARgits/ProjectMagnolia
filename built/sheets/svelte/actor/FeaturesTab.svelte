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
    <th colspan="3">Config. <ConfigureItemButton doc={$doc} type="feature" action="create" /></th>
  </thead>
  <tbody>
    {#each $doc.itemTypes.feature as item}
      <tr>
        <td
          >{item.name} <i class="fa-solid fa-dice-d20" /> <i class="fa-regular fa-dice-d20" />
          <i class="fa-light fa-dice-d20" /> <i class="fa-thin fa-dice-d20" /> <i class="fa-duotone fa-dice-d20" /></td
        >
        <td>{item.system.level.current}</td>
        <td class="config"><ConfigureItemButton {item} action="edit" /></td>
        <td class="config"><i class="fa-solid fa-stars" /></td>
        <td class="config"><ConfigureItemButton {item} action="delete" /></td>
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
    &:not(.config) > i {
      cursor: pointer;
      text-shadow: 0px 0px 10px red;
    }
  }
</style>
