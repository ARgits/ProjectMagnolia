<script>
  import { getContext } from "svelte";
  import TDvariants from "./TDvariants.svelte";
  export let tabData;
  let data = getContext("chaAdvActorData");
  let typeStr;
  let thead;
  let description;
  let max;
  let cellWidth
  let thWidth
  let trWidth 
  //TODO: reconfigure thead for localization
  switch (tabData) {
    case "attributes":
      typeStr = "attributes";
      thead = ["Name", "Increase", "Value", "Decrease", "Mod", "Cost"];
      description = "";
      max = 30;
      break;
    case "skills":
      typeStr = "skills";
      thead = ["Name", "Increase", "Rank", "Decrease", "Cost"];
      description = "";
      max = 4;
      break;
    case "features":
      typeStr = "features";
      thead = ["Name", "Source", "Increase", "Level", "Max Level", "Decrease", "Cost"];
      description = "";
      max = 1;
      break;
  }
  thWidth = 100 / thead.length
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

<div class="flex flexrow">
  <div class="scrollable">
  <table>
    <thead>
      <tr style:width="{trWidth}px">
        {#each thead as th}
          <th style:width="{thWidth}%"> {th} </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each Object.entries($data[tabData]) as attr, key}
        <TDvariants type={$data[tabData]} {thead} {typeStr} val={attr} {max} bind:trWidth bind:cellWidth {key} bind:description />
      {/each}
    </tbody>
  </table>
</div>
  <div class="description">
    <label for="description">Description</label>
    <div>{description}</div>
  </div>
</div>

<style>
  .description{
    height: 270px;
    padding-left: 2px;
    border-left: 1px solid black;
    border-bottom: 1px solid black;
  }
  table thead {
    display: block;
    width: 100%;
    position: sticky;
    inset-block-start: -0.05em;
    border-bottom: 2px solid #ccc;
  }
  table {
    border-collapse: collapse;
  }
  tbody{
    display: block;
    height: 234px;
    width: 100%;
    overflow-y: auto;
  }
  tr {
    border: 1px solid black;
    display: table;
  }
  th {
    background: rgb(100, 100, 100);
    border: 1px solid black;
    text-align: center;
    padding: 0.2em;
  }
</style>
