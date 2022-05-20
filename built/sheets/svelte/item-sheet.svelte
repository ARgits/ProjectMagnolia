<svelte:options accessors={true} />

<script>
  import InputForDocumentSheet from "../../general svelte components/InputForDocumentSheet.svelte";
  export let doc;
</script>

Name: <InputForDocumentSheet bind:value={doc.name}/>
