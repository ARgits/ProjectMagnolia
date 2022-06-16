<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  const doc = getContext("DocumentSheetObject");
  let highlight = "";
  console.log($doc.items, "actors items tab");
</script>

<table>
  <thead>
    <th>Name</th>
    <th>Level</th>
    <th>Config.</th>
  </thead>
  <tbody>
    {#each $doc.items.contents as item}
      <tr>
        <td>{item.name}</td>
        <td>{item.system.level.current}</td>
        <td><i class="fa-solid fa-pen-to-square"></i></td>
        <td><i class="fa-solid fa-stars"></i></td>
        <td><i class="fa-solid fa-trash-can"></i></td>
      </tr>
    {/each}
  </tbody>
</table>

<style lang="scss"></style>
