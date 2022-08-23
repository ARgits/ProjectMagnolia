<svelte:options accessors={true}/>

<script>
    import InputForDocumentSheet from "../general components/InputForDocumentSheet.svelte";
    import { getContext } from "svelte";

    const doc = getContext("DocumentSheetObject");
</script>

Name:
<InputForDocumentSheet valuePath="name" type="text"/>
