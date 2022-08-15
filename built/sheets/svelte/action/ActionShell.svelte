<svelte:options accessors={true}/>

<script>
    import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
    import Action from "./Action.svelte";
    import { setContext } from "svelte";

    export let elementRoot;
    export let action;
    setContext(`TopActionData`, action);
    const uuid = $action.uuid;
</script>
<ApplicationShell bind:elementRoot>
    <Action {uuid}/>
</ApplicationShell>
