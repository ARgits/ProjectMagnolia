<svelte:options accessors={true} />
<script>
  import { getContext } from "svelte";
  const doc = getContext("DocumentSheetObject");
  let highlight = "";
</script>
<ul>
{#each $doc.items as item}
  <li>Name: {item.name}</li>
{/each}
</ul>
<style lang="scss"></style>
