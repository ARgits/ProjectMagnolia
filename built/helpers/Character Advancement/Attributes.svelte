<script>
  import { getContext } from "svelte";
  import TDvariants from "./TDvariants.svelte";
  export let tabData;
  let data = getContext("chaAdvActorData");
  let typeStr;
  let thead;
  let description;
  let max;
  //TODO: reconfigure thead for localization
  switch (tabData) {
    case "attributes":
      typeStr = "attributes";
      thead = ["Name", "Increase", "Value", "Decrease", "Mod", "Cost", "Description"];
      description = "";
      max = 30;
      break;
    case "skills":
      typeStr = "skills";
      thead = ["Name", "Increase", "Rank", "Decrease", "Cost", "Description"];
      description = "";
      max = 4;
      break;
  }
  $: {
    for (let [key, attr] of Object.entries($data.attributes)) {
      attr.mod = Math.floor((attr.value - 10) / 2);
    }
  }
  const rankName = ["untrained", "trained", "expert", "master", "legend"];
  $: for (let [key, skill] of Object.entries($data.skills)) {
    skill.rankName = rankName[skill.level];
  }
</script>

<table>
  <tr>
    {#each thead as th}
      <th> {th} </th>
    {/each}
  </tr>
  {#each Object.entries($data[tabData]) as attr, key}
    <TDvariants type={$data[tabData]} {thead} {typeStr} val={attr} {max} {key} bind:description />
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
