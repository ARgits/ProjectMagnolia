<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  export let value;
  const document = getContext("DocumentSheetObject");
  console.log(document);
  let data;
  $: {
    data = { img: document.img, system: document.system, flags: document.flags };
    console.log(data);
  }
</script>

<input
  bind:value
  on:change={() => {
    document.update(data);
  }}
/>
