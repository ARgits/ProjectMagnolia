<svelte:options accessors={true}/>
<script>
    import { getContext } from "svelte";

    export let data;
    const { application } = getContext('external');
    const { target, formula, damageTypeData, submit } = data;
    let dType = damageTypeData[0].value;

    function close() {
        submit.callback(dType);
        application.close();
    }

    /**
     * @param token {ARd20Token}
     * @param hover {boolean}*/
    function onHoverToken(token, hover) {
        token.hover = hover;
        token.refresh();
    }
</script>
<div>You're attacking <span on:mouseenter={()=>onHoverToken(target.target, true)}
                            on:mouseleave={()=>onHoverToken(target.target,false)}>
    {target.actor.name}</span> with <span
        class="formula">{formula}</span></div>
<label>
    Choose damage type:
    <select bind:value={dType}>
        {#each damageTypeData as opt (opt.label)}
            <option value={opt.value}>{opt.label}</option>
        {/each}
    </select>
</label>
<button on:click={close}>{submit.label}</button>
<style>
    span {
        padding: 0 10px;
        background-color: rgba(0, 0, 0, 0.1);
        border: 1px solid black
    }
</style>