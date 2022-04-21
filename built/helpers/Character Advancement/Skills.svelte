<script>
  import { getContext } from "svelte";
  import TDvariants from "./TDvariants.svelte";
  let doc = getContext("chaAdvActorData");
  const typeStr = "skills";
  const rankName = ["untrained", "trained", "expert", "master", "legend"];
  $: for (let [key, skill] of Object.entries($doc.skills)) {
    skill.rankName = rankName[skill.value];
  }
</script>

<table>
  <tr>
    <th>Name</th>
    <th>Increase</th>
    <th>Rank</th>
    <th>Decrease</th>
    <th>Cost</th>
    <th>Description</th>
  </tr>
  {#each Object.entries($doc.skills) as skill, key}
    <TDvariants type={$doc.skills} {typeStr} val={skill} max={4} {key} description={""} />
  {/each}
</table>

<style>
  table {
    background-color: inherit;
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
