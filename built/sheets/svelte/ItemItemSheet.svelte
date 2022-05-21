<svelte:options accessors={true} />

<script>
  import InputForDocumentSheet from "./InputForDocumentSheet.svelte";
  export let doc;
</script>

Name: <InputForDocumentSheet bind:value={doc.name}/>
