<svelte:options accessors={true}/>

<script>
    import { writable } from "svelte/store";
    import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
    import Action from "./Action.svelte";
    import { setContext } from "svelte";

    export let elementRoot;
    export let action;
    console.log($action.subActions);
    for (const subAct of $action.subActions) {
        setContext(`ActionData-${subAct.id}`, writable(subAct));
    }
    setContext(`ActionData-${$action.id}`, action);
    const id = $action.id;

</script>
<ApplicationShell bind:elementRoot>
    <Action {id}/>
</ApplicationShell>
