<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { getContext, setContext } from "svelte";
  import { writable } from "svelte/store";
  import { TJSDocument } from "@typhonjs-fvtt/runtime/svelte/store";
  export let elementRoot;
  const { application } = getContext("external");
  const uuid = application.object.uuid;
  const doc = new TJSDocument();
  $: doc.setFromUUID(uuid);
  console.log(uuid, doc);
</script>

<ApplicationShell bind:elementRoot>
  <div>blank sheet</div>
  <input />
</ApplicationShell>
