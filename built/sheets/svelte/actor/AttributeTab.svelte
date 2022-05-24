<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  const doc = getContext("DocumentSheetObject");
  let highlight = "";
</script>

<div class="attributes">
  Attributes:
  {#each Object.entries($doc.system.attributes) as attribute}
    <div>
      <span
        class:highlight={highlight === attribute[0]}
        on:mouseenter={() => (highlight = attribute[0])}
        on:mouseleave={() => (highlight = "")}
        on:click={(event) => {
          event.preventDefault;
          return $doc.rollAttributeTest(attribute[0], { event: event });
        }}
      >
        {attribute[1].label}
      </span>: {attribute[1].value}; Mod: {attribute[1].mod};
    </div>
  {/each}
</div>

<style lang="scss">
  .attributes {
    display: flex;
    flex-direction: column;
  }
  .highlight {
    background-color: red;
  }
</style>
