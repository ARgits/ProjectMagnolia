<svelte:options accessors={true}/>
<script>
    import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
    import { getContext } from "svelte";
    import TargetBlock from "./TargetBlock.svelte";

    export let elementRoot;
    export let mainToken;
    let targets;
    let vision;
    let allTokens;
    const uuid = $mainToken.uuid;
    console.log(uuid);
    const { application } = getContext('external');
    console.log(application);
    $:{
        targets = application.configureTargets($mainToken);
    }
</script>
<ApplicationShell bind:elementRoot>
    {#each $targets as target (target.uuid)}
        <TargetBlock {target}/>
    {/each}
</ApplicationShell>
<style lang="scss">

</style>