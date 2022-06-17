<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  import ConfigureItemButton from "../general components/ConfigureItemButton.svelte";
  const doc = getContext("DocumentSheetObject");
  let highlight = "";
  function ShowDescription() {}
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
        <td>
          <span on:click={() => ShowDescription()}>{item.name} </span>
          {#if item.system.hasAttack || item.system.hasDamage}
            <i class="fa-light fa-dice-d20" data-tooltip="roll" />
          {/if}
        </td>
        <td>{item.system.level.current}</td>
        <td class="config"><ConfigureItemButton {item} action="edit" /></td>
        <td class="config"><i class="fa-solid fa-stars" /></td>
        <td class="config"><ConfigureItemButton {item} action="delete" /></td>
      </tr>
      <span>{@html item.system.description}</span>
    {/each}
  </tbody>
</table>

<style lang="scss">
  tr {
    &:nth-of-type(odd) {
      background-color: transparent;
    }
    &:nth-of-type(even) {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }
  td {
    text-align: center;
    &.config {
      width: 5%;
    }
    &:not(.config) > i:hover {
      cursor: pointer;
      text-shadow: 0px 0px 10px red;
    }
  }
</style>
