<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  const doc = getContext("DocumentSheetObject");
  let highlight = "";
</script>


<label for="skills">Skills</label>
<div class="skills">
  {#each Object.entries($doc.system.skills) as skill}
    <div
      class="skill"
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

  .skills {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    & > div {
      display: flex;
      flex-direction: column;
      border: 1px solid black;
      flex: 1 0 calc(100% / 6 - 1.2em);
      align-items: center;
      margin: 0.6em;
      border-radius: 10px;
      &:hover {
        text-shadow: red 0px 0px 0.5em;
        cursor: pointer;
      }
    }
  }
  label {
    text-align: center;
    border: 1px solid black;
    width: 100%;
    display: inline-block;
  }
</style>
