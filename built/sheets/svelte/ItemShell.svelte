<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { getContext, setContext, afterUpdate, beforeUpdate } from "svelte";
  import { writable } from "svelte/store";
  import { TJSDocument } from "@typhonjs-fvtt/runtime/svelte/store";
  export let elementRoot;
  const { application } = getContext("external");
  const doc = new TJSDocument(application.object);
  console.log($doc);
  afterUpdate(async () => {
    console.log("afterUpdate");
    let data = $doc.data
    console.log(data)
    await application.object.update();
  });
</script>

<ApplicationShell bind:elementRoot>
  <div>blank sheet</div>
  <div>Name: {$doc.data.name}</div>
  <input bind:value={$doc.data.name} />
</ApplicationShell>
