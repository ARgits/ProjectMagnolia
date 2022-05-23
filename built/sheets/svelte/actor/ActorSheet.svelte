<svelte:options accessors={true} />

<script>
  import InputForDocumentSheet from "../general components/InputForDocumentSheet.svelte";
  import ImageWithFilePicker from "../general components/ImageWithFilePicker.svelte";
  export let doc;
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
  {#each doc.system.attributes as attribute, key}
    <div>
      {attribute.Label}: <InputForDocumentSheet bind:value={attribute.value} />; Mod: {attribute.mod};
    </div>
  {/each}
</div>

<style>
  .attributes {
    display: flex;
    flex-direction: column;
  }
</style>
