<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  export let value;
  export let type = "text";
  const document = getContext("DocumentSheetObject");
  let data;
  $: value = type === "number" ? parseInt(value) : value;
  $: {
    data = { img: $document.img, system: $document.system, flags: $document.flags, name: $document.name };
  }
  let input
  
</script>

<input
  bind:this={input}
  bind:value
  on:change={() => {
    $document.update(data);
  }}
/>
<style lang="scss">
  input{
    background-color: inherit;
  }
</style>
