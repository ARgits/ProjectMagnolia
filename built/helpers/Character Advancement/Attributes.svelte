<script>
  import { getContext } from "svelte";
  import TDvariants from "./TDvariants.svelte";
  
  export let tabData;
  const element = getContext("chaAdvElementParameters")
  const data = getContext("chaAdvActorData");
  const settings = game.settings.get("ard20", "profLevel");
  let typeStr;
  let thead;
  let description;
  let max;
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
      max = settings.length - 1;
      break;
    case "features":
      typeStr = "features";
      thead = ["Name", "Source", "Increase", "Level", "Max Level", "Decrease", "Cost"];
      description = "";
      max = 1;
      break;
  }
  let thWidth = 100 / thead.length;
  $: {
    for (let [key, attr] of Object.entries($data.attributes)) {
      attr.mod = attr.value - 10;
    }
  }
  const rankName = settings.map((setting) => {
    return setting.label;
  });
  $: for (let [key, skill] of Object.entries($data.skills)) {
    skill.rankName = rankName[skill.level];
  }
</script>

<div class="flex flexrow">
  <table>
    <thead bind:offsetHeight={$element.theadHeight}>
      <tr style:width="{$element.trWidth}px">
        {#each thead as th}
          <th style:width="{thWidth}%" class="last"> {th} </th>
        {/each}
      </tr>
    </thead>
    <tbody style="--tbodyHeight:{0.95*$element.boxHeight - $element.theadHeight}px">
      {#each Object.entries($data[tabData]) as attr, key}
        <TDvariants
          type={$data[tabData]}
          {thead}
          {typeStr}
          val={attr}
          {max}
          {key}
          bind:description
        />
      {/each}
    </tbody>
  </table>
  <div class="description">
    <label for="description">Description</label>
    <div>{description}</div>
  </div>
</div>

<style lang="scss">
  .description {
    height: 100%;
    padding-left: 2px;
    border-left: 1px solid black;
    border-bottom: 1px solid black;
  }
  table thead {
    display: block;
    width: 100%;
    position: sticky;
    inset-block-start: -0.05em;
  }
  table {
    border-collapse: collapse;
  }
  tbody {
    display: block;
    max-height: var(--tbodyHeight);
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
    border-width: 0px 1px 0 1px;
    text-align: center;
    padding: 0.2em;
    word-break: break-word;
    &:last-child{
      border-right: 0px;
    }
  }
</style>
