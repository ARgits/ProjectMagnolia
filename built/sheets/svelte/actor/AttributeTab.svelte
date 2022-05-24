<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  const doc = getContext("DocumentSheetObject");
  let highlight = "";
</script>

<div class="attributes">
  {#each Object.entries($doc.system.attributes) as attribute}
    <div
      class:highlight={highlight === attribute[0]}
      on:mouseenter={() => (highlight = attribute[0])}
      on:mouseleave={() => (highlight = "")}
      on:click={(event) => {
        event.preventDefault;
        return $doc.rollAttributeTest(attribute[0], { event: event });
      }}
    >
      <span>
        {attribute[1].label}
      </span>
      <span> Value: {attribute[1].value}</span>
      <span> Mod: {attribute[1].mod}</span>
    </div>
  {/each}
</div>
<div class="skills">
  {#each Object.entries($doc.system.skills) as skill}
    <div
      class="skill"
      class:highlight={highlight === skill[0]}
      on:mouseenter={() => (highlight = skill[0])}
      on:mouseleave={() => (highlight = "")}
      on:click={(event) => {
        event.preventDefault();
        return $doc.rollSkill(skill[0], { event: event });
      }}
    >
      <span>
        {skill[1].rankName}
      </span>
      <span>
        {skill[1].name}
      </span>
      <span>
        Bonus: {#if skill[1].value > 0}+{/if}
        {skill[1].value}
      </span>
    </div>
  {/each}
</div>

<style lang="scss">
  .attributes,
  .skills {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    & > div {
      display: flex;
      flex-direction: column;
      border: 1px solid black;
      flex: 1 0 calc(100% / 6);
    }
  }
  .highlight {
    text-shadow: red 0px 0px 0.5em;
    cursor: pointer;
  }
</style>
