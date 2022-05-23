<svelte:options accessors={true} />

<script>
  import InputForDocumentSheet from "../general components/InputForDocumentSheet.svelte";
  import ImageWithFilePicker from "../general components/ImageWithFilePicker.svelte";
  export let doc;
  console.log(doc)
</script>

<header>
  <div class="name">
    Name: <InputForDocumentSheet bind:value={doc.name} />
  </div>
  <div class="cha-img">
    <ImageWithFilePicker path={"img"} alt={"character portrait"} />
  </div>
</header>
<div class="attributes">
  Attributes:
  {#each Object.values(doc.system.attributes) as attribute}
    <div>
      {attribute.Label}: {attribute.value}; Mod: {attribute.mod};
    </div>
  {/each}
</div>

<style>
  .attributes {
    display: flex;
    flex-direction: column;
  }
</style>
