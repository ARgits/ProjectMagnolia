<svelte:options accessors={true} />

<script>
  import InputForDocumentSheet from "../general components/InputForDocumentSheet.svelte"
  import ImageWithFilePicker from "../general components/ImageWithFilePicker.svelte";
  export let doc;
</script>

<header>
  <div class="name">
    Name: <InputForDocumentSheet bind:value={doc.name} />
  </div>
  <div class="cha-img">
    <ImageWithFilePicker bind:src={doc.img} alt={"character portrait"} />
  </div>
</header>
