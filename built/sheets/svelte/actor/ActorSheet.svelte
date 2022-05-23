<svelte:options accessors={true} />

<script>
  import InputForDocumentSheet from "../general components/InputForDocumentSheet.svelte"
  import ImageWithFilePicker from "../general components/ImageWithFilePicker.svelte";
  export let doc;
</script>

<header>
  <div class="name">
    Name: <InputForDocumentSheet path={"name"} />
  </div>
  <div class="cha-img">
    <ImageWithFilePicker path={"img"} alt={"character portrait"} />
  </div>
</header>
