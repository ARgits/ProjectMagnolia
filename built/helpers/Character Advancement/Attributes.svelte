<script>
  import AddButton from "./AddButton.svelte";
  import MinusButton from "./MinusButton.svelte";
  import TDvariants from "./TDvariants.svelte";
  import { data } from "./store.js";
  let attributes;
  data.subscribe((value) => {
    attributes = value.attributes;
  });
  $: {
    for (let [key, attr] of Object.entries(attributes)) {
      attr.mod = Math.floor((attr.value - 10) / 2);
    }
  }
  let descArr = ["be strong", "be flexible", ""];
  let description = "";
</script>

<table>
  <tr>
    <th>Name</th>
    <th>Increase</th>
    <th>Value</th>
    <th>Decrease</th>
    <th>Mod</th>
    <th>Description</th>
  </tr>
  {#each Object.entries(attributes) as attr, key}
    <TDvariants type={attributes} typeStr={Object.keys({ attributes })[0]} val={attr} {key} bind:description />
  {/each}
</table>

<style global>
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
  }
</style>
