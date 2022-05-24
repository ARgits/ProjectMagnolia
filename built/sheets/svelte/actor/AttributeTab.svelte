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
      </span>
      <span>{attribute[1].value}</span>
      <span>{attribute[1].mod}</span>
    </div>
  {/each}
</div>
<div class="skills">
  {#each Object.entries($doc.system.skills) as skill}
    <div class="skill">
      <span
        class:highlight={highlight === skill[0]}
        on:mouseenter={() => (highlight = skill[0])}
        on:mouseleave={() => (highlight = "")}
        on:click={(event) => {
          event.preventDefault();
          return $doc.rollSkill(skill[0], { event: event });
        }}
      >
        {skill[1].rankName}
        {skill[1].name}
      </span>
      <span>
        {#if skill[1].value > 0}+{/if} {skill[1].value}
      </span>
    </div>
  {/each}
</div>

<style lang="scss">
  .attributes, .skills {
    display: flex;
    flex-direction: row;
    & > div {
      flex-direction: column;
      border:1px solid black
    }
  }
  .highlight {
    text-shadow: red 0px 0px 0.5em;
    cursor: pointer;
  }
</style>
