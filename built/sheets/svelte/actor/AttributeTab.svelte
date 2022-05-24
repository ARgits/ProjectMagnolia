<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  const doc = getContext("DocumentSheetObject");
  function HighlightLabel(event) {
    event.preventDefault();
    const target = event.target;
    if (event.type === "mouseenter") target.classList.add("highlight");
    else if (event.type === "mouseleave") target.classList.remove("highlight");
  }
</script>

<div class="attributes">
  Attributes:
  {#each Object.entries($doc.system.attributes) as attribute}
    <div>
      <span
        on:mouseenter={(event)=>HighlightLabel(event)}
        on:mouseleave={(event)=>HighlightLabel(event)}
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
