<script>
  import { getContext } from "svelte";
  import TDvariants from "./TDvariants.svelte";
  let data = getContext("chaAdvActorData");
  let typeStr = "attributes";
  $: {
    for (let [key, attr] of Object.entries($data.attributes)) {
      attr.mod = Math.floor((attr.value - 10) / 2);
    }
  }
  let description = "";
</script>

<table>
  <tr>
    <th>Name</th>
    <th>Increase</th>
    <th>Value</th>
    <th>Decrease</th>
    <th>Mod</th>
    <th>Cost</th>
    <th>Description</th>
  </tr>
  {#each Object.entries($data.attributes) as attr, key}
    <TDvariants type={$data.attributes} {typeStr} val={attr} min={1} max={30} {key} bind:description />
  {/each}
</table>

<style>
  table {
    border-collapse: collapse;
  }
  tr {
    border: 1px solid black;
  }
  th {
    text-align: center;
    border-right: 1px solid black;
    padding: 0.2em;
    position: sticky;
  }
</style>
