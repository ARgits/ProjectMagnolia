<script>
  import { getContext } from "svelte";
  import ChangeButton from "./ChangeButton.svelte";
  export let max;
  export let val;
  export let key;
  export let type;
  export let description;
  export let typeStr;
  const data = getContext("chaAdvActorData");
  const formulas = getContext("chaAdvXpFormulas").formulas;
  let variables = {};
  let cost;
  let min =
    getContext("chaAdvActorOriginalData")[typeStr][val[0]].value ||
    getContext("chaAdvActorOriginalData")[typeStr][val[0]].level; //TODO: redo this for not only attributes and skills
  $: {
    for (let [key, variable] of Object.entries(getContext("chaAdvXpFormulas").variables)) {
      variables[variable.shortName] =
        variable.shortName === key ? $data[key][typeStr].value ?? $data[key][typeStr].level : 1; //TODO: change "1" to variable, that will represent "count" and other things
      console.log(variables[variable.shortName]);
    }
    cost = math.evaluate(formulas[typeStr], variables);
    console.log(cost)
  }
  function changeDesc(val) {
    if (!val[1].description) return "";
    description = val[1].description;
  }
  let strMod;
  $: if (val[1].mod !== undefined) {
    strMod = val[1].mod < 0 ? `${val[1].mod}` : `+${val[1].mod}`;
  }
  let last = key === Object.values(type).length - 1 ? "last" : "";
</script>

<tr>
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <td class={last} on:mouseover={() => changeDesc(val)}> {val[0]} </td>
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <td class={last} on:mouseover={() => changeDesc(val)}>
    <ChangeButton type={typeStr} subtype={val[0]} {max} {cost} />
  </td>
  {#if val[1].rankName}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <td class={last} on:mouseover={() => changeDesc(val)}> {val[1].rankName} </td>
  {:else}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <td class={last} on:mouseover={() => changeDesc(val)}> {val[1].value} </td>
  {/if}
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <td class={last} on:mouseover={() => changeDesc(val)}> <ChangeButton type={typeStr} subtype={val[0]} {min} /> </td>
  {#if val[1].mod !== undefined}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <td class={last} on:mouseover={() => changeDesc(val)}> {strMod} </td>
  {/if}
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <td class={last} on:mouseover={() => changeDesc(val)}> {cost} </td>
  {#if key === 0}
    <td class="description" rowspan={Object.values(type).length}> {description} </td>
  {/if}
</tr>

<style>
  .last {
    border-bottom: 1px solid black;
  }
  .description {
    max-width: 1em;
  }
  td {
    text-align: center;
    border-right: 1px solid black;
    border-left: 1px solid black;
  }
  tr {
    border: 1px solid black;
  }
</style>
