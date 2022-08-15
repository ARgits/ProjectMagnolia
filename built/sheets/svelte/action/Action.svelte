<svelte:options accessors={true}/>
<script>
    import { getContext } from "svelte";
    import { slide } from "svelte/transition";
    import DamageSelectDialog
        from "../../../general svelte components and dialogs/DamageSelect/DamageSelectDialog.svelte";
    import { writable } from "svelte/store";
    import MultiSelect from "svelte-multiselect/MultiSelect.svelte";
    import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

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
        { id: 1, value: 'Attack', disabled: false },
        { id: 2, value: 'Common', disabled: false },
        { id: 3, value: 'Heal', disabled: true },
        { id: 4, value: 'Damage', disabled: false }
    ];

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
<div class:expanded class:isSubAction={$action.parent.action} class="main">
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
            {#if $action.parent.action}
                <div>
                    Use on Fail? <input type="checkbox" on:change={submit} bind:checked={$action.useOnFail}/>
                </div>
            {/if}
            <div class="formula">
                <div>
                    {#if $action.useOnFail}Success{/if}Formula: <input on:change={submit} bind:value={$action.formula}/>
                </div>
                {#if $action.parent.action && $action.useOnFail}
                    <div> Fail Formula<input on:change={submit} bind:value={$action.failFormula}/></div>
                {/if}
                {#if $action.type === 'Damage'}
                    <MultiSelect on:change={submit} bind:selected={$action.damage} options={damageTypeOptions}>
                        <i slot="remove-icon" class="fa-solid fa-xmark"></i>
                    </MultiSelect>
                {/if}
            </div>
            {#if !$action.parent.action}
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
            {#if !$action.parent.action}
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
  :global(button.remove-all) {
    width: initial;
  }
</style>