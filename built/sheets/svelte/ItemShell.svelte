<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import Input from "./DocumentSheetInput.svelte"
  import { getContext, setContext, afterUpdate, tick } from "svelte";
  import { writable } from "svelte/store";
  import { TJSDocument } from "@typhonjs-fvtt/runtime/svelte/store";
  export let elementRoot;
  const { application } = getContext("external");
  setContext("document",$doc)
  const document = application.object
  const doc = new TJSDocument(application.object);
  let updateData = "";
</script>

<ApplicationShell bind:elementRoot>
  <div>blank sheet</div>
  <div>Name: {$doc.data.name}</div>
  <Input bind:value={$doc.data.name} {document} path={"name"} label={"Name"}/>

</ApplicationShell>
