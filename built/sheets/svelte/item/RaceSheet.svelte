<svelte:options accessors={true} />

<script>
  import InputForDocumentSheet from "../general components/InputForDocumentSheet.svelte";
  import ImageWithFilePicker from "../general components/ImageWithFilePicker.svelte";
  import { getContext } from "svelte";
  const doc = getContext("DocumentSheetObject");
</script>

<header>
  <ImageWithFilePicker path={"img"} alt={"item portrait"} />
  <h1>
    <InputForDocumentSheet bind:value={$doc.name} label="name" />
  </h1>
</header>
<div class="main">
  <div class="speed">
    <InputForDocumentSheet bind:value={$doc.system.speed} label="speed" type="integer"/>
  </div>
  <div class="health">
    <InputForDocumentSheet bind:value={$doc.system.health} label="health" type="integer"/>
  </div>
  <br />
  <div class="attributes">
    {#each Object.entries($doc.system.attributes) as attribute}
      <div>
        <InputForDocumentSheet bind:value={$doc.system.attributes[attribute[0]]} label={attribute[0]} type="integer" />
      </div>
    {/each}
  </div>
  <br />
  <div class="skills" />
</div>

<style lang="scss">
  header {
    max-height: 25%;
    display: flex;
  }
  .main {
    display: flex;
    flex-direction: row;
    & > div {
      flex-basis: 50%;
    }
    & > div.attributes {
      display: flex;
      flex-direction: column;
      flex-basis: 100%;
    }
  }
</style>
