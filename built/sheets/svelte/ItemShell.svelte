<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { getContext, setContext, afterUpdate} from "svelte";
  import { writable } from "svelte/store";
  import { TJSDocument } from "@typhonjs-fvtt/runtime/svelte/store";
  export let elementRoot;
  const { application } = getContext("external");
  const doc = new TJSDocument(application.object);
  let updateData = "";
  console.log($doc);
  afterUpdate(async () => {
    if (updateData) {
      console.log("afterUpdate");
      console.log(updateData);
      await application.object.update(updateData);
    } else updateData = { name: $doc.name, data: $doc.data.data };
  });
</script>

<ApplicationShell bind:elementRoot>
  <div>blank sheet</div>
  <div>Name: {$doc.data.name}</div>
  <input bind:value={$doc.data.name} />
</ApplicationShell>
