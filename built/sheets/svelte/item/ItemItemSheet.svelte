<svelte:options accessors={true} />

<script>
  import InputForDocumentSheet from "../general components/InputForDocumentSheet.svelte";
  export let doc;
</script>

Name: <InputForDocumentSheet bind:value={doc.name}/>
