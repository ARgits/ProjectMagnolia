<script>
  import AddButton from "./AddButton.svelte";
  import MinusButton from "./MinusButton.svelte";
  export let val;
  export let key;
  export let type;
  export let description;
  export let typeStr;
  function changeDesc(val) {
    if (!val[1].description) return "";
    description = val[1].description;
  }
</script>

<tr>
  <td class={val[1].description} on:mouseover={() => changeDesc(val)}>{val[0]}</td>
  <td class={val[1].description} on:mouseover={() => changeDesc(val)}
    ><AddButton type={typeStr} subtype={val[0]} />
  </td>
  {#if val[1].rankName}
    <td class={val[1].description} on:mouseover={() => changeDesc(val)}>{val[1].rankName}</td>
  {:else}
    <td class={val[1].description} on:mouseover={() => changeDesc(val)}>{val[1].value}</td>
  {/if}
  <td class={val[1].description} on:mouseover={() => changeDesc(val)}
    ><MinusButton type={typeStr} subtype={val[0]} /></td
  >
  {#if val[1].mod}
    <td
      class={val[1].description}
      on:mouseover={() => {
        description = val[1].description;
      }}>{val[1].mod}</td
    >
  {/if}
  {#if key === 0}
    <td class="description" rowspan={Object.values(type).length}>{description}</td>
  {/if}
</tr>

<style>
  .description {
    max-width: 1em;
  }
  td {
    text-align: center;
    border-right: 1px solid black;
  }
  tr {
    border: 1px solid black;
  }
</style>
