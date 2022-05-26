<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  export let value;
  export let type = "text";
  export let label;
  const document = getContext("DocumentSheetObject");
  let data;
  let labelElem;
  let input;
  $: if (label && input) input.style.width = `calc(100% - ${labelElem.clientWidth}px)`;
  $: value = type === "number" ? parseInt(value) : value;
  $: {
    data = { img: $document.img, system: $document.system, flags: $document.flags, name: $document.name };
  }
</script>

{#if label}
  <span bind:this={labelElem}>{label}</span>
{/if}
<input
  bind:this={input}
  bind:value
  on:change={() => {
    $document.update(data);
  }}
/>

<style lang="scss">
  input,
  span {
    background-color: inherit;
    color: inherit;
  }
</style>
