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
  //export let cellWidth;
  const originalData = getContext("chaAdvActorOriginalData");
  const aditionalData = getContext("chaAdvAditionalData");
  const element = getContext("chaAdvElementParameters")
  const formulas = getContext("chaAdvXpFormulas").formulas;
  let variables = {};
  let cost;
  let min;
  let widthPercent = 100 / thead.length;
  switch (typeStr) {
    case "attributes":
      min = originalData[typeStr][val[0]].value;
      break;
    case "skills":
      min = originalData[typeStr][val[0]].level;
      break;
    case "features":
      console.log(aditionalData, val[0]);
      min = aditionalData.feats.awail[val[0]].system.level.current;
      max = aditionalData.feats.awail[val[0]].system.level.max;
      break;
  }
  $: {
    for (let [key, variable] of Object.entries(getContext("chaAdvXpFormulas").variables)) {
      switch (key) {
        case "attributes":
          variables[variable.shortName] = typeStr === key ? val[1].value : 0;
          break;
        case "skills":
          variables[variable.shortName] = typeStr === key ? val[1].level : 0;
          break;
        case "features":
          variables[variable.shortName] = typeStr === key ? val[1].system.level.initial : 0;
          break;
        case "skillsCount":
          variables[variable.shortName] = 1; //TODO: rewrite
          break;
        case "featuresCount":
          variables[variable.shortName] = 1; //TODO: rewrite
      }
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

<tr bind:offsetHeight={$element.trHeight} bind:clientWidth={$element.trWidth} style="--cellWidth:{widthPercent}%">
  {#if thead.includes("Name")}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <td class={last} on:mouseover={() => changeDesc(val)}> {val[0]} </td>
  {/if}
  {#if thead.includes("Source")}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <td class={last} on:mouseover={() => changeDesc(val)}> {@html val[1].system.source.label} </td>
  {/if}
  {#if thead.includes("Increase")}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <td class={last} on:mouseover={() => changeDesc(val)}>
      <ChangeButton type={typeStr} subtype={val[0]} {max} {cost} />
    </td>
  {/if}
  {#if thead.includes("Level")}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <td class={last} on:mouseover={() => changeDesc(val)}>
      {val[1].system.level.initial}
    </td>
  {/if}
  {#if thead.includes("Max Level")}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <td class={last} on:mouseover={() => changeDesc(val)}> {val[1].system.level.max} </td>
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
    <td class={last} on:mouseover={() => changeDesc(val)}>
      <ChangeButton type={typeStr} subtype={val[0]} {min} />
    </td>
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
    <td class="description" rowspan={thead.length}> {description} </td>
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
    width: var(--cellWidth);
    word-break: break-word;
  }
  tr {
    border: 1px solid black;
    width: 100%;
    display: table;
  }
</style>
