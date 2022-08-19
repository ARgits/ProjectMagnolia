<svelte:options accessors={true}/>
<script>
    import { getContext } from "svelte";
    import { slide } from "svelte/transition";

    import { writable } from "svelte/store";
    import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
    import ActionDamageComponent from "./ActionDamageComponent.svelte";

    export let uuid;
    const { application } = getContext("external");
    const rootAction = getContext('TopActionData');
    const action = uuid === application.reactive.action.uuid ? rootAction : writable($rootAction._getSubAction(uuid, false));
    const targetType = [
        { id: 1, value: 'single' },
        { id: 2, value: 'self' },
        { id: 3, value: 'all' },
        { id: 4, value: 'custom' }
    ];
    const actionType = [
        { id: 1, value: 'Attack', disabled: true },
        { id: 2, value: 'Common', disabled: true },
        { id: 3, value: 'Heal', disabled: true },
        { id: 4, value: 'Damage', disabled: false }
    ];
    const components = {
        damage: ActionDamageComponent
    };

    async function submit() {
        await application.submit();
    }

    async function checkRange(type, val) {
        $action[type][val] = Math[val]($action[type].min, $action[type].max);
        await application.submit();
    }

    let expanded = !$action?.parent.action;

    function toggle() {
        if ($action.parent.action) {
            expanded = !expanded;
        }
    }

    async function remove(id) {
        let subActArr = [...$action.subActions];
        const index = subActArr.findIndex(act => act.id === id);
        if (index !== -1) {
            subActArr.splice(index, 1);
            await application.submit();
            $action.subActions = [...subActArr];
        }
    }

    async function addSubAction() {
        const newSubActArr = await $action.addSubAction();
        await application.submit();
        $action.subActions = newSubActArr;
    }

    let damageTypeOptions = [];
    for (const [key1, label1] of Object.entries(CONFIG.ARd20.DamageTypes)) {
        for (const [key2, label2] of Object.entries(CONFIG.ARd20.DamageSubTypes)) {
            damageTypeOptions = [...damageTypeOptions, {
                label: `${localize(label1)} ${localize(label2)}`,
                value: [key1, key2]
            }];
        }
    }
</script>
<div class:expanded class:isSubAction={$action.isSubAction} class="main">
    <h3>
        <span on:click={toggle}>{$action.name}</span>
        <slot name="removeIcon"></slot>
    </h3>
    {#if expanded}
        <div transition:slide={{duration:300}}>
            <div class="name">
                Name: <input on:change={submit} bind:value={$action.name}/>
            </div>
            <div class="type">
                <select on:blur={submit} bind:value={$action.type}>
                    {#each actionType as type}
                        <option disabled={type.disabled} value={type.value}>{type.value}</option>
                    {/each}
                </select>
            </div>
            {#if $action.isSubAction}
                <div>
                    Use on Fail? <input type="checkbox" on:change={submit} bind:checked={$action.useOnFail}/>
                </div>
            {/if}
            <fieldset class="formula">
                <svelte:component this={components[$action.type.toLowerCase()]} actionStore={action}/>
            </fieldset>
            {#if !$action.isSubAction}
                <fieldset class="range">
                    <legend>Range</legend>
                    <div>
                        Minimum: <input on:change={()=>checkRange('range','min')} bind:value={$action.range.min}/>
                    </div>
                    <div>
                        Maximum: <input on:change={()=>checkRange('range','max')} bind:value={$action.range.max}/>
                    </div>
                </fieldset>
            {/if}
            {#if !$action.isSubAction}
                <fieldset class="target">
                    <legend>Target</legend>
                    <select on:blur={submit} bind:value={$action.target.type}>
                        {#each targetType as target (target.id)}
                            <option value={target.value}>
                                {target.value}
                            </option>
                        {/each}
                    </select>
                    {#if $action.target.type === 'custom'}
                        <div>
                            <input bind:value={$action.target.min} on:change={()=>checkRange('target','min')}/>
                            <span>/</span>
                            <input bind:value={$action.target.max} on:change={()=>checkRange('target','max')}/>
                        </div>
                    {/if}
                </fieldset>
            {/if}
            <fieldset class="actions">
                <legend>
                    Add actions <i on:click={addSubAction} class="fa-solid fa-file-plus"></i>
                </legend>
                {#each $action.subActions as subAct (subAct.id)}
                    <svelte:self uuid={subAct.uuid}>
                        <i slot="removeIcon" on:click={()=>{remove(subAct.id)}} class="fa-solid fa-trash-can"></i>
                    </svelte:self>
                {/each}
            </fieldset>
            <!--{#if !$action.parent.action}
                <div class="submit">
                    <button on:click={submit}>
                        Submit
                    </button>
                </div>
            {/if}!-->
        </div>
    {/if}
</div>
<style lang="scss">

</style>