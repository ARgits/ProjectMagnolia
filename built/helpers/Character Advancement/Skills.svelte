<script>
  import TDvariants from "./TDvariants.svelte";
  import { data } from "./store.js";
  let skills;
  data.subscribe((value) => {
    skills = value.skills;
  });
  const rankName = ["untrained", "trained", "expert", "master", "legend"];
  $: for (let [key, skill] of Object.entries(skills)) {
    skill.rankName = rankName[skill.value];
  }
</script>

<table>
  <tr>
    <th>Name</th>
    <th>Increase</th>
    <th>Rank</th>
    <th>Decrease</th>
    <th>Description</th>
  </tr>
  {#each Object.entries(skills) as skill, key}
    <TDvariants type={skills} typeStr={Object.keys({ skills })[0]} val={skill} {key} description={""} />
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
  }
  th {
    padding: 0.2em;
  }
</style>
