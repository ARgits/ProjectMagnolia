<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  const doc = getContext("DocumentSheetObject");
</script>

<div class="attributes">
  Attributes:
  {#each Object.values($doc.system.attributes) as attribute}
    <div>
      {attribute.label}: {attribute.value}; Mod: {attribute.mod};
    </div>
  {/each}
</div>

<style lang="scss">
  .attributes {
    display: flex;
    flex-direction: column;
  }
</style>
