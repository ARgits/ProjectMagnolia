<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  const doc = getContext("DocumentSheetObject");
</script>

<div class="attributes">
  Attributes:
  {#each Object.entries($doc.system.attributes) as attribute}
    <div>
      <span
        on:click={(event) => {
          event.preventDefault;
          return $doc.rollAttributeTest(attribute[0], {event:event});
        }}>{attribute[1].label}</span
      >: {attribute[1].value}; Mod: {attribute[1].mod};
    </div>
  {/each}
</div>

<style lang="scss">
  .attributes {
    display: flex;
    flex-direction: column;
  }
</style>
