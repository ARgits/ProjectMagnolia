<script>
  import { getContext } from "svelte";
  import ChangeButton from "./ChangeButton.svelte";
  export let max;
  export let val;
  export let key;
  export let type;
  export let description;
  export let typeStr;
  export let thead;
  const data = getContext("chaAdvActorData");
  const formulas = getContext("chaAdvXpFormulas").formulas;
  let variables = {};
  let cost;
  let min;
  switch (typeStr) {
    case "attributes":
      min = getContext("chaAdvActorOriginalData")[typeStr][val[0]].value;
      break;
    case "skills":
      min = getContext("chaAdvActorOriginalData")[typeStr][val[0]].level;
      break;
  }
  $: {
    for (let [key, variable] of Object.entries(getContext("chaAdvXpFormulas").variables)) {
      variables[variable.shortName] =
        typeStr === key ? $data[typeStr][val[0]].level ?? $data[typeStr][val[0]].value : 0; //TODO: change "1" to variable, that will represent "count" and other things
    }
    cost = math.evaluate(formulas[typeStr], variables);
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
  //TODO: reconfigure thead for localization
</script>

<tr>
  {#if thead.includes("Name")}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <td class={last} on:mouseover={() => changeDesc(val)}> {val[0]} </td>
  {/if}
  {#if thead.includes("Increase")}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <td class={last} on:mouseover={() => changeDesc(val)}>
      <ChangeButton type={typeStr} subtype={val[0]} {max} {cost} />
    </td>
  {/if}

  {#if thead.includes("Rank")}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <td class={last} on:mouseover={() => changeDesc(val)}> {val[1].rankName} </td>
  {/if}
  {#if thead.includes("Value")}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <td class={last} on:mouseover={() => changeDesc(val)}> {val[1].value} </td>
  {/if}
  {#if thead.includes("Decrease")}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <td class={last} on:mouseover={() => changeDesc(val)}> <ChangeButton type={typeStr} subtype={val[0]} {min} /> </td>
  {/if}
  {#if thead.includes("Mod")}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <td class={last} on:mouseover={() => changeDesc(val)}> {strMod} </td>
  {/if}
  {#if thead.includes("Cost")}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <td class={last} on:mouseover={() => changeDesc(val)}> {cost} </td>
  {/if}
  {#if key === 0 && thead.includes("Description")}
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
